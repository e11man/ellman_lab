import fs from 'fs';
import path from 'path';


const TARGET_DIRECTORY = path.join(process.cwd(), 'games');

export function scanFiles() {
    try {
        if (!fs.existsSync(TARGET_DIRECTORY)) {
            console.warn(`Directory not found: ${TARGET_DIRECTORY}`);
            return [];
        }

        const files = fs.readdirSync(TARGET_DIRECTORY);

        // if name is .DS_Store or dolphin_config exclude
        const filteredFiles = files.filter(file => file !== '.DS_Store' && file !== 'dolphin_config');

        //extract the first 6 bytes of the file to get the game id and return game id and file path
        const gameIds = filteredFiles.map(file => {
            const filePath = path.join(TARGET_DIRECTORY, file);
            let gameId = 'UNKNOWN';
            try {
                const fd = fs.openSync(filePath, 'r');

                // Check if it's a WBFS file by reading the first 4 bytes (Magic)
                const magicBuffer = Buffer.alloc(4);
                fs.readSync(fd, magicBuffer, 0, 4, 0);

                let offset = 0;
                if (magicBuffer.toString() === 'WBFS') {
                    offset = 512; // WBFS header is 512 bytes, Disc Header starts after
                }

                const buffer = Buffer.alloc(6);
                fs.readSync(fd, buffer, 0, 6, offset);
                fs.closeSync(fd);

                // Game ID is ASCII, so we use toString() (defaults to utf8)
                // We also trim null bytes just in case
                gameId = buffer.toString().replace(/\0/g, '');
            } catch (e) {
                console.error(`Error reading file header for ${file}:`, e);
            }
            // retrun files withoout the extension name for fileName 
            const fileName = file.split('.').slice(0, -1).join('.');
            return { fileName, gameId, filePath };
        });


        return gameIds
    } catch (error) {
        console.error('Error scanning directory:', error);
        return [];
    }
}
