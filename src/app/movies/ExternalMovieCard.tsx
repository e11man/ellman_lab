"use client";

import { useState, useEffect, useCallback } from 'react';
import { AnimatedPromoCard } from "@/components/ui/promo-card";

interface ExternalMovieCardProps {
    title: string;
    year: string;
    mediaType: 'movie' | 'tv';
    url: string;
    posterUrl: string | null;
    overview: string;
}

type DownloadStatus = 'idle' | 'starting' | 'capturing' | 'downloading' | 'complete' | 'error';

interface DownloadState {
    status: DownloadStatus;
    progress: number;
    error?: string;
    outputFile?: string;
}

export function ExternalMovieCard({ title, year, mediaType, url, posterUrl, overview }: ExternalMovieCardProps) {
    const [downloadState, setDownloadState] = useState<DownloadState>({
        status: 'idle',
        progress: 0
    });

    // Poll for download status when downloading
    useEffect(() => {
        if (downloadState.status !== 'capturing' && downloadState.status !== 'downloading') {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/movies/download');
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'complete') {
                        setDownloadState({
                            status: 'complete',
                            progress: 100,
                            outputFile: data.outputFile
                        });
                    } else if (data.status === 'error') {
                        setDownloadState({
                            status: 'error',
                            progress: 0,
                            error: data.error
                        });
                    } else if (data.status !== 'idle') {
                        setDownloadState({
                            status: data.status,
                            progress: data.progress || 0
                        });
                    }
                }
            } catch (error) {
                console.error('Error polling download status:', error);
            }
        }, 1000);

        return () => clearInterval(pollInterval);
    }, [downloadState.status]);

    const handleDownload = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();

        if (downloadState.status !== 'idle' && downloadState.status !== 'complete' && downloadState.status !== 'error') {
            return; // Already downloading
        }

        setDownloadState({ status: 'starting', progress: 0 });

        try {
            const response = await fetch('/api/movies/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, title, year, mediaType })
            });

            const data = await response.json();

            if (data.alreadyExists) {
                // Movie already exists, switch to play mode
                setDownloadState({
                    status: 'complete',
                    progress: 100,
                    outputFile: data.outputFile
                });
            } else if (data.started) {
                setDownloadState({
                    status: 'capturing',
                    progress: 0
                });
            } else if (data.error) {
                setDownloadState({
                    status: 'error',
                    progress: 0,
                    error: data.error
                });
            }
        } catch (error) {
            setDownloadState({
                status: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }, [url, title, year, mediaType, downloadState.status]);

    const handlePlay = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        // Reload the page to show the newly downloaded movie in the local library
        window.location.reload();
    }, []);

    // Determine button text and action
    let buttonText = 'Download & Watch';
    let buttonAction: (e: React.MouseEvent) => void | Promise<void> = handleDownload;
    let subtitle = `${year} • ${mediaType === 'tv' ? 'TV Show' : 'Movie'}`;

    switch (downloadState.status) {
        case 'starting':
            buttonText = 'Starting...';
            subtitle = 'Initializing download...';
            break;
        case 'capturing':
            buttonText = 'Capturing...';
            subtitle = 'Finding video stream...';
            break;
        case 'downloading':
            buttonText = `${downloadState.progress.toFixed(0)}%`;
            subtitle = `Downloading... ${downloadState.progress.toFixed(0)}%`;
            break;
        case 'complete':
            buttonText = 'Play';
            buttonAction = handlePlay;
            subtitle = 'Downloaded! Ready to play';
            break;
        case 'error':
            buttonText = 'Retry';
            subtitle = `Error: ${downloadState.error || 'Failed'}`;
            break;
    }

    // Use poster if available, otherwise use a placeholder
    const imageSrc = posterUrl || '/placeholder-movie.jpg';

    return (
        <div className="relative">
            <AnimatedPromoCard
                imageSrc={imageSrc}
                title={title}
                subtitle={subtitle}
                buttonText={buttonText}
                href={url}
                onButtonClick={buttonAction}
            />
            {/* Progress bar overlay when downloading */}
            {downloadState.status === 'downloading' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-lg">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${downloadState.progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
