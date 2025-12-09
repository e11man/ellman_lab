"use client";

import { useState } from 'react';
import { GameCard } from './GameCard';
import { DolphinMenuCard } from './DolphinMenuCard';
import { WiiMenuCard } from './WiiMenuCard';

interface GameFile {
    fileName: string;
    gameId: string;
    filePath: string;
}

interface GameListProps {
    files: GameFile[];
}

export function GameList({ files }: GameListProps) {
    const [playingGamePath, setPlayingGamePath] = useState<string | null>(null);

    const handlePlayClick = (filePath: string) => {
        setPlayingGamePath(filePath);
    };

    const handleQuitClick = async () => {
        try {
            const response = await fetch('/api/dolphin_quit', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                setPlayingGamePath(null);
            }
        } catch (error) {
            console.error('Error quitting game:', error);
        }
    };

    // Filter files: if a game is playing, only show that game
    const displayedFiles = playingGamePath 
        ? files.filter(file => file.filePath === playingGamePath)
        : files;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Only show menu cards when no game is playing */}
            {!playingGamePath && (
                <>
                    {/* Standalone Dolphin Menu Card */}
                    <DolphinMenuCard />
                    {/* Wii Menu Card */}
                    <WiiMenuCard />
                </>
            )}
            {displayedFiles.map((file, i) => (
                <div key={file.gameId || i} className="w-full flex items-center justify-center">
                    <GameCard
                        imageSrc={`https://art.gametdb.com/wii/cover/US/${file.gameId}.png`}
                        title={file.fileName}
                        subtitle=""
                        buttonText="Play"
                        filePath={file.filePath}
                        isPlaying={playingGamePath === file.filePath}
                        onPlayClick={handlePlayClick}
                        onQuitClick={handleQuitClick}
                    />
                </div>
            ))}
        </div>
    );
}
