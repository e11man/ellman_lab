import { NextRequest } from 'next/server';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Track current download state
let currentDownload: {
    id: string;
    title: string;
    progress: number;
    status: 'capturing' | 'downloading' | 'converting' | 'complete' | 'error';
    error?: string;
    outputFile?: string;
} | null = null;

const MOVIES_DIR = path.join(process.cwd(), 'movies');
const SEARCH_DIR = path.join(process.cwd(), 'search');
const VENV_PYTHON = path.join(SEARCH_DIR, 'venv', 'bin', 'python');

function sanitizeFilename(name: string): string {
    // Remove or replace characters that are invalid in filenames
    return name
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, title, year, mediaType } = body;

        if (!url || !title) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: url, title' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if already downloading
        if (currentDownload && currentDownload.status !== 'complete' && currentDownload.status !== 'error') {
            return new Response(
                JSON.stringify({
                    error: 'A download is already in progress',
                    currentDownload: {
                        title: currentDownload.title,
                        progress: currentDownload.progress,
                        status: currentDownload.status
                    }
                }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Generate output filename
        const filename = sanitizeFilename(`${title} (${year || 'Unknown'})`);
        const outputPath = path.join(MOVIES_DIR, `${filename}.mp4`);

        // Check if file already exists
        if (fs.existsSync(outputPath)) {
            return new Response(
                JSON.stringify({
                    alreadyExists: true,
                    message: 'Movie already exists in your library',
                    outputFile: outputPath,
                    filename: `${filename}.mp4`
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Ensure movies directory exists
        if (!fs.existsSync(MOVIES_DIR)) {
            fs.mkdirSync(MOVIES_DIR, { recursive: true });
        }

        // Initialize download state
        const downloadId = Date.now().toString();
        currentDownload = {
            id: downloadId,
            title,
            progress: 0,
            status: 'capturing',
            outputFile: outputPath
        };

        // Start the download process asynchronously
        startDownloadProcess(url, outputPath, downloadId);

        return new Response(
            JSON.stringify({
                started: true,
                downloadId,
                title,
                outputFile: outputPath
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Download API error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to start download' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

export async function GET() {
    return new Response(
        JSON.stringify(currentDownload || { status: 'idle' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}

async function startDownloadProcess(cineby_url: string, outputPath: string, downloadId: string) {
    const openBrowserScript = path.join(SEARCH_DIR, 'open_browser.py');
    const downloadScript = path.join(SEARCH_DIR, 'download_video.py');

    try {
        // Step 1: Capture M3U8 URL using open_browser.py
        console.log(`Starting M3U8 capture for: ${cineby_url}`);

        interface CaptureResult {
            m3u8_url: string;
            cookies: string;
            headers: {
                'User-Agent': string;
                'Referer': string;
                'Origin': string;
            };
        }

        const captureResult = await new Promise<CaptureResult>((resolve, reject) => {
            const proc = spawn(VENV_PYTHON, [openBrowserScript, cineby_url], {
                cwd: SEARCH_DIR
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                console.log('open_browser.py:', data.toString());
            });

            // Set a timeout of 60 seconds for M3U8 capture
            const timeout = setTimeout(() => {
                proc.kill();
                reject(new Error('Timeout waiting for M3U8 URL'));
            }, 60000);

            proc.on('close', (code) => {
                clearTimeout(timeout);
                const lastLine = stdout.trim().split('\n').pop() || '';
                try {
                    const result = JSON.parse(lastLine) as CaptureResult;
                    if (result.m3u8_url) {
                        resolve(result);
                    } else {
                        reject(new Error(`No M3U8 URL in response. Exit code: ${code}. stderr: ${stderr}`));
                    }
                } catch {
                    // Fallback: try to find a plain URL (for backwards compatibility)
                    if (lastLine.includes('.m3u8')) {
                        resolve({
                            m3u8_url: lastLine,
                            cookies: '',
                            headers: { 'User-Agent': '', 'Referer': '', 'Origin': '' }
                        });
                    } else {
                        reject(new Error(`Failed to parse capture result. Exit code: ${code}. stdout: ${stdout}. stderr: ${stderr}`));
                    }
                }
            });

            proc.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        console.log(`Captured M3U8 URL: ${captureResult.m3u8_url}`);
        console.log(`Cookies: ${captureResult.cookies ? 'present' : 'none'}`);

        // Verify we're still tracking this download
        if (!currentDownload || currentDownload.id !== downloadId) {
            console.log('Download was cancelled or replaced');
            return;
        }

        // Step 2: Download the video with captured auth info
        currentDownload.status = 'downloading';

        // Download to .ts first (temporary file), then convert to .mp4
        const tempTsPath = outputPath.replace(/\.mp4$/, '.ts');

        const downloadArgs = [
            downloadScript,
            captureResult.m3u8_url,
            '-o', tempTsPath,
            '--json'
        ];

        // Add auth headers if present
        if (captureResult.cookies) {
            downloadArgs.push('--cookies', captureResult.cookies);
        }
        if (captureResult.headers['Referer']) {
            downloadArgs.push('--referer', captureResult.headers['Referer']);
        }
        if (captureResult.headers['User-Agent']) {
            downloadArgs.push('--user-agent', captureResult.headers['User-Agent']);
        }
        if (captureResult.headers['Origin']) {
            downloadArgs.push('--origin', captureResult.headers['Origin']);
        }

        await new Promise<void>((resolve, reject) => {
            const proc = spawn(VENV_PYTHON, downloadArgs, {
                cwd: SEARCH_DIR
            });

            proc.stdout.on('data', (data) => {
                const lines = data.toString().split('\n').filter((l: string) => l.trim());
                for (const line of lines) {
                    try {
                        const event = JSON.parse(line);
                        if (event.event === 'progress' && currentDownload) {
                            currentDownload.progress = event.percent;
                        } else if (event.event === 'complete' && currentDownload) {
                            currentDownload.progress = 100;
                            currentDownload.status = 'complete';
                        } else if (event.event === 'error' && currentDownload) {
                            currentDownload.status = 'error';
                            currentDownload.error = event.message;
                        }
                    } catch {
                        // Non-JSON output, ignore
                    }
                }
            });

            proc.stderr.on('data', (data) => {
                console.log('download_video.py:', data.toString());
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Download process exited with code ${code}`));
                }
            });

            proc.on('error', (err) => {
                reject(err);
            });
        });

        // Step 3: Convert .ts to .mp4 for better seeking support
        if (currentDownload && currentDownload.id === downloadId) {
            currentDownload.status = 'converting';
            currentDownload.progress = 99;
        }

        if (fs.existsSync(tempTsPath)) {
            console.log(`Converting ${tempTsPath} to ${outputPath}...`);

            try {
                // Use ffmpeg to convert .ts to .mp4 with fast copy (no re-encoding)
                // -err_detect ignore_err: ignore errors in the stream
                // -fflags +genpts+discardcorrupt: regenerate timestamps and discard corrupt packets
                // -max_muxing_queue_size 9999: handle out-of-order packets
                execSync(`ffmpeg -err_detect ignore_err -fflags +genpts+discardcorrupt -i "${tempTsPath}" -c copy -bsf:a aac_adtstoasc -max_muxing_queue_size 9999 -movflags +faststart "${outputPath}" -y`, {
                    stdio: 'inherit',
                    timeout: 1200000 // 20 minute timeout for conversion (in case of large files)
                });

                // Delete the old .ts file
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(tempTsPath);
                    console.log(`Deleted temporary file: ${tempTsPath}`);
                }
            } catch (convError) {
                console.error('FFmpeg conversion failed:', convError);
                // Even if conversion "failed", the .mp4 might have been created (partially)
                // If the .mp4 exists and is reasonably sized, delete the .ts anyway
                if (fs.existsSync(outputPath)) {
                    const mp4Size = fs.statSync(outputPath).size;
                    const tsSize = fs.statSync(tempTsPath).size;
                    // If mp4 is at least 70% of ts size, consider it successful enough
                    if (mp4Size > tsSize * 0.7) {
                        fs.unlinkSync(tempTsPath);
                        console.log(`Deleted temporary file after partial conversion: ${tempTsPath}`);
                    } else {
                        console.log(`Keeping .ts file - mp4 size (${mp4Size}) is too small compared to ts (${tsSize})`);
                    }
                } else if (fs.existsSync(tempTsPath)) {
                    // Update the output path to use .ts since conversion totally failed
                    if (currentDownload && currentDownload.id === downloadId) {
                        currentDownload.outputFile = tempTsPath;
                    }
                }
            }
        }

        // Mark as complete
        if (currentDownload && currentDownload.id === downloadId) {
            currentDownload.status = 'complete';
            currentDownload.progress = 100;
        }

    } catch (error) {
        console.error('Download process error:', error);
        if (currentDownload && currentDownload.id === downloadId) {
            currentDownload.status = 'error';
            currentDownload.error = error instanceof Error ? error.message : 'Unknown error';
        }
    }
}
