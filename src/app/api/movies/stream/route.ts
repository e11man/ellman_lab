import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MOVIES_DIRECTORY = path.join(process.cwd(), 'movies');

// Map file extensions to MIME types
const getContentType = (fileName: string): string => {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm',
        '.m4v': 'video/x-m4v',
    };
    return mimeTypes[ext] || 'video/mp4';
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('file');

    if (!fileName) {
        return new NextResponse('File name is required', { status: 400 });
    }

    // Security: prevent directory traversal
    const safeFileName = path.basename(fileName);
    const filePath = path.join(MOVIES_DIRECTORY, safeFileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const contentType = getContentType(safeFileName);

    // Get range header for video streaming
    const range = request.headers.get('range');

    if (range) {
        // Parse range header
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': contentType,
        };
        return new NextResponse(file as any, { status: 206, headers: head });
    } else {
        // Return full file
        const file = fs.createReadStream(filePath);
        const head = {
            'Content-Length': fileSize.toString(),
            'Content-Type': contentType,
        };
        return new NextResponse(file as any, { status: 200, headers: head });
    }
}
