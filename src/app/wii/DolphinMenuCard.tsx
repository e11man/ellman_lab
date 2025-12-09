"use client";

import { GameCard } from './GameCard';

interface DolphinMenuCardProps {
    isPlaying?: boolean;
    onPlayClick?: (filePath: string) => void;
    onQuitClick?: () => void;
}

export function DolphinMenuCard({ isPlaying = false, onPlayClick, onQuitClick }: DolphinMenuCardProps) {
    const handlePlayClick = async (filePath: string) => {
        try {
            const response = await fetch('/api/dolphin_menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success && onPlayClick) {
                onPlayClick(filePath);
            }
        } catch (error) {
            console.error('Error calling dolphin_menu:', error);
        }
    };

    return (
        <div className="w-full flex items-center justify-center">
            <GameCard
                imageSrc="https://art.gametdb.com/wii/cover/US/RWIE01.png"
                title="Dolphin Emulator"
                subtitle="Open Wii Menu"
                buttonText="Launch"
                filePath="dolphin_menu"
                isPlaying={isPlaying}
                onPlayClick={handlePlayClick}
                onQuitClick={onQuitClick}
            />
        </div>
    );
}
