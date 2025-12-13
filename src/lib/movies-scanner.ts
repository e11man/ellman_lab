import fs from 'fs';
import path from 'path';

const TARGET_DIRECTORY = path.join(process.cwd(), 'movies');

export function scanMovies() {
    try {
        if (!fs.existsSync(TARGET_DIRECTORY)) {
            console.warn(`Directory not found: ${TARGET_DIRECTORY}`);
            return [];
        }

        const files = fs.readdirSync(TARGET_DIRECTORY);

        // Filter out system files and only include video files
        const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v'];
        const filteredFiles = files.filter(file => {
            if (file === '.DS_Store') return false;
            const ext = path.extname(file).toLowerCase();
            return videoExtensions.includes(ext);
        });

        // Return movie files with their paths
        const movies = filteredFiles.map(file => {
            const filePath = path.join(TARGET_DIRECTORY, file);
            const fileName = path.basename(file, path.extname(file));
            return { fileName, filePath, fileNameWithExt: file };
        });

        return movies;
    } catch (error) {
        console.error('Error scanning movies directory:', error);
        return [];
    }
}



