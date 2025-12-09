"use client";

import { GameCard } from './GameCard';

interface WiiMenuCardProps {
    isPlaying?: boolean;
    onPlayClick?: (filePath: string) => void;
    onQuitClick?: () => void;
}

export function WiiMenuCard({ isPlaying = false, onPlayClick, onQuitClick }: WiiMenuCardProps) {
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
                title="Wii Menu"
                subtitle="Launch System Menu"
                buttonText="Open"
                filePath="wii_menu"
                isPlaying={isPlaying}
                onPlayClick={handlePlayClick}
                onQuitClick={onQuitClick}
            />
        </div>
    );
}
