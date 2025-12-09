"use client";

import { useState } from 'react';
import { MovieCard } from './MovieCard';

interface MovieFile {
    fileName: string;
    filePath: string;
    fileNameWithExt: string;
}

interface MovieListProps {
    movies: MovieFile[];
}

export function MovieList({ movies }: MovieListProps) {
    const [playingMoviePath, setPlayingMoviePath] = useState<string | null>(null);

    const handlePlayClick = (moviePath: string) => {
        if (moviePath) {
            setPlayingMoviePath(moviePath);
        } else {
            setPlayingMoviePath(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie, i) => (
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

