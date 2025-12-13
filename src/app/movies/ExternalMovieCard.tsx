"use client";

import { AnimatedPromoCard } from "@/components/ui/promo-card";

interface ExternalMovieCardProps {
    title: string;
    year: string;
    mediaType: 'movie' | 'tv';
    url: string;
    posterUrl: string | null;
    overview: string;
}

export function ExternalMovieCard({ title, year, mediaType, url, posterUrl, overview }: ExternalMovieCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Use poster if available, otherwise use a placeholder
    const imageSrc = posterUrl || '/placeholder-movie.jpg';

    const mediaLabel = mediaType === 'tv' ? 'TV Show' : 'Movie';
    const subtitle = `${year} • ${mediaLabel}`;

    return (
        <AnimatedPromoCard
            imageSrc={imageSrc}
            title={title}
            subtitle={subtitle}
            buttonText="Watch on Cineby"
            href={url}
            onButtonClick={handleClick}
        />
    );
}
