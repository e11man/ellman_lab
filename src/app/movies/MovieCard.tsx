"use client";

import { AnimatedPromoCard } from "@/components/ui/promo-card";
import { Button } from "@/components/ui/button";

interface MovieCardProps {
    title: string;
    subtitle: string;
    buttonText: string;
    fileName: string;
    moviePath: string;
    isPlaying?: boolean;
    onPlayClick?: (moviePath: string) => void;
}

export function MovieCard({ title, subtitle, buttonText, fileName, moviePath, isPlaying = false, onPlayClick }: MovieCardProps) {
    const handlePlayClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onPlayClick) {
            onPlayClick(moviePath);
        }
    };

    const handleClosePlayer = () => {
        if (onPlayClick) {
            onPlayClick('');
        }
    };

    // Use a placeholder image or generate one from the movie name
    const imageSrc = `/api/movies/thumbnail?file=${encodeURIComponent(fileName)}`;

    return (
        <>
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <div className="bg-green-500/90 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-lg">
                            NOW PLAYING
                        </div>
                    </div>
                )}
            </div>

            {isPlaying && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={handleClosePlayer}>
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                            onClick={handleClosePlayer}
                            variant="destructive"
                            size="lg"
                            className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            Close
                        </Button>
                        <video
                            src={`/api/movies/stream?file=${encodeURIComponent(fileName)}`}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            )}
        </>
    );
}
