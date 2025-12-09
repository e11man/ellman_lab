"use client";

import { useState, useEffect } from 'react';
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

    // Fetch session state on mount
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch('/api/game-session');
                const data = await response.json();
                if (data.success && data.session) {
                    if (data.session.is_playing && data.session.current_game_path) {
                        setPlayingGamePath(data.session.current_game_path);
                    } else {
                        setPlayingGamePath(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching game session:', error);
            }
        };

        fetchSession();

        // Poll every 2 seconds to sync state across browser tabs
        const interval = setInterval(fetchSession, 2000);

        return () => clearInterval(interval);
    }, []);

    const handlePlayClick = async (filePath: string) => {
        setPlayingGamePath(filePath);
        // Update session state in database
        try {
            await fetch('/api/game-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gamePath: filePath, isPlaying: true }),
            });
        } catch (error) {
            console.error('Error updating game session:', error);
        }
    };

    const handleQuitClick = async () => {
        try {
            const response = await fetch('/api/dolphin_quit', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                setPlayingGamePath(null);
                // Clear session state in database
                await fetch('/api/game-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ clear: true }),
                });
            }
        } catch (error) {
            console.error('Error quitting game:', error);
        }
    };

    // Check if a menu is playing
    const isWiiMenuPlaying = playingGamePath === 'wii_menu';
    const isDolphinMenuPlaying = playingGamePath === 'dolphin_menu';
    const isMenuPlaying = isWiiMenuPlaying || isDolphinMenuPlaying;

    // Filter files: if a game is playing, only show that game
    const displayedFiles = playingGamePath && !isMenuPlaying
        ? files.filter(file => file.filePath === playingGamePath)
        : files;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Show menu cards when no game is playing, or show only the playing menu */}
            {!playingGamePath ? (
                <>
                    {/* Standalone Dolphin Menu Card */}
                    <DolphinMenuCard 
                        isPlaying={false}
                        onPlayClick={handlePlayClick}
                        onQuitClick={handleQuitClick}
                    />
                    {/* Wii Menu Card */}
                    <WiiMenuCard 
                        isPlaying={false}
                        onPlayClick={handlePlayClick}
                        onQuitClick={handleQuitClick}
                    />
                </>
            ) : isMenuPlaying ? (
                <>
                    {/* Show only the playing menu card */}
                    {isDolphinMenuPlaying && (
                        <DolphinMenuCard 
                            isPlaying={true}
                            onPlayClick={handlePlayClick}
                            onQuitClick={handleQuitClick}
                        />
                    )}
                    {isWiiMenuPlaying && (
                        <WiiMenuCard 
                            isPlaying={true}
                            onPlayClick={handlePlayClick}
                            onQuitClick={handleQuitClick}
                        />
                    )}
                </>
            ) : null}
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
