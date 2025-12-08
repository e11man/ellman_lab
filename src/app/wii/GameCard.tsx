"use client";

import { AnimatedPromoCard } from "@/components/ui/promo-card";

interface GameCardProps {
    imageSrc: string;
    title: string;
    subtitle: string;
    buttonText: string;
    filePath: string;
}

export function GameCard({ imageSrc, title, subtitle, buttonText, filePath }: GameCardProps) {
    const handlePlayClick = async (e: React.MouseEvent) => {
        try {
            const response = await fetch('/api/dolphin_run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filePath }),
            });
            const data = await response.json();
            console.log('API response:', data);
        } catch (error) {
            console.error('Error calling dolphin_run:', error);
        }
    };

    return (
        <AnimatedPromoCard
            imageSrc={imageSrc}
            title={title}
            subtitle={subtitle}
            buttonText={buttonText}
            href="#"
            onButtonClick={handlePlayClick}
        />
    );
}
