"use client";

import { useState } from 'react';
import { MovieList } from './MovieList';
import { Input } from '@/components/ui/input';

interface MovieFile {
    fileName: string;
    filePath: string;
    fileNameWithExt: string;
}

interface MoviesPageClientProps {
    movies: MovieFile[];
}

export function MoviesPageClient({ movies }: MoviesPageClientProps) {
    const [filter, setFilter] = useState('');

    return (
        <main className="min-h-screen bg-background p-4 md:p-8">
            {/* Container to center content on large screens */}
            <div className="container mx-auto">
                <div className="flex flex-col gap-6 mb-8">
                    <h1 className="text-4xl font-bold text-foreground">Movies</h1>
                    <div className="max-w-md">
                        <Input
                            type="search"
                            placeholder="Search movies..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>
                {/* Responsive Grid:
                   - default: 1 column (Mobile)
                   - md: 2 columns (Tablet)
                   - lg: 3 columns (Desktop)
                   - xl: 4 columns (Large Desktop)
                */}
                <MovieList movies={movies} filter={filter} />
            </div>
        </main>
    );
}
