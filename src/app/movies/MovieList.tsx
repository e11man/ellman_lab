"use client";

import { useState, useMemo, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import { ExternalMovieCard } from './ExternalMovieCard';

interface MovieFile {
    fileName: string;
    filePath: string;
    fileNameWithExt: string;
}

interface ExternalResult {
    id: number;
    title: string;
    year: string;
    mediaType: 'movie' | 'tv';
    url: string;
    posterUrl: string | null;
    overview: string;
}

interface MovieListProps {
    movies: MovieFile[];
    filter?: string;
}

export function MovieList({ movies, filter = '' }: MovieListProps) {
    const [playingMoviePath, setPlayingMoviePath] = useState<string | null>(null);
    const [externalResults, setExternalResults] = useState<ExternalResult[]>([]);
    const [isSearchingExternal, setIsSearchingExternal] = useState(false);

    const handlePlayClick = (moviePath: string) => {
        if (moviePath) {
            setPlayingMoviePath(moviePath);
        } else {
            setPlayingMoviePath(null);
        }
    };

    // Filter movies based on search query
    const filteredMovies = useMemo(() => {
        if (!filter.trim()) {
            return movies;
        }

        const searchTerm = filter.toLowerCase().trim();
        return movies.filter(movie =>
            movie.fileName.toLowerCase().includes(searchTerm)
        );
    }, [movies, filter]);

    // Search external API when no local results and filter is provided
    useEffect(() => {
        const searchExternal = async () => {
            if (filteredMovies.length === 0 && filter.trim()) {
                setIsSearchingExternal(true);
                try {
                    const response = await fetch(`/api/movies/search-external?query=${encodeURIComponent(filter.trim())}`);
                    if (response.ok) {
                        const data = await response.json();
                        setExternalResults(data.results || []);
                    } else {
                        setExternalResults([]);
                    }
                } catch (error) {
                    console.error('Error searching external API:', error);
                    setExternalResults([]);
                } finally {
                    setIsSearchingExternal(false);
                }
            } else {
                setExternalResults([]);
            }
        };

        // Debounce the search
        const timeoutId = setTimeout(searchExternal, 500);
        return () => clearTimeout(timeoutId);
    }, [filteredMovies.length, filter]);

    // Show local movies if found
    if (filteredMovies.length > 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMovies.map((movie, i) => (
                    <div key={movie.filePath || i} className="w-full flex items-center justify-center">
                        <MovieCard
                            title={movie.fileName}
                            subtitle=""
                            buttonText="Play"
                            fileName={movie.fileNameWithExt}
                            moviePath={movie.filePath}
                            isPlaying={playingMoviePath === movie.filePath}
                            onPlayClick={handlePlayClick}
                        />
                    </div>
                ))}
            </div>
        );
    }

    // Show loading state when searching external
    if (isSearchingExternal) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                    Searching online for "{filter}"...
                </p>
            </div>
        );
    }

    // Show external results if found
    if (externalResults.length > 0) {
        return (
            <div>
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        Not found in your library. Showing {externalResults.length} streaming result{externalResults.length !== 1 ? 's' : ''} from Cineby:
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {externalResults.map((result) => (
                        <div key={`${result.mediaType}-${result.id}`} className="w-full flex items-center justify-center">
                            <ExternalMovieCard
                                title={result.title}
                                year={result.year}
                                mediaType={result.mediaType}
                                url={result.url}
                                posterUrl={result.posterUrl}
                                overview={result.overview}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // No results at all
    return (
        <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
                {filter.trim() ? `No movies found matching "${filter}"` : 'No movies found'}
            </p>
        </div>
    );
}



