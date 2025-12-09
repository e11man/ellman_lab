"use client";

import { AnimatedPromoCard } from "@/components/ui/promo-card";
import { Button } from "@/components/ui/button";

interface GameCardProps {
    imageSrc: string;
    title: string;
    subtitle: string;
    buttonText: string;
    filePath: string;
    isPlaying?: boolean;
    onPlayClick?: (filePath: string) => void;
    onQuitClick?: () => void;
}

export function GameCard({ imageSrc, title, subtitle, buttonText, filePath, isPlaying = false, onPlayClick, onQuitClick }: GameCardProps) {
    const handlePlayClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/dolphin_run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filePath }),
            });
            const data = await response.json();
            if (data.success && onPlayClick) {
                onPlayClick(filePath);
            }
        } catch (error) {
            console.error('Error calling dolphin_run:', error);
        }
    };

    const handleQuitClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuitClick) {
            onQuitClick();
        }
    };

    return (
        <div className={isPlaying ? "relative" : ""}>
            <AnimatedPromoCard
                imageSrc={imageSrc}
                title={title}
                subtitle={isPlaying ? "Playing" : subtitle}
                buttonText={isPlaying ? "Playing..." : buttonText}
                href="#"
                onButtonClick={handlePlayClick}
                className={isPlaying ? "opacity-60 grayscale" : ""}
            />
            {isPlaying && (
                <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <div className="bg-green-500/90 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-lg mb-4">
                            NOW PLAYING
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
                        <Button 
                            onClick={handleQuitClick}
                            variant="destructive"
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            Quit Game
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
