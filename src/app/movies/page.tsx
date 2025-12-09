import { scanMovies } from '../../lib/movies-scanner';
import { MovieList } from './MovieList';

export default function MoviesPage() {
    const movies = scanMovies();

    return (
        <main className="min-h-screen bg-background p-4 md:p-8">
            {/* Container to center content on large screens */}
            <div className="container mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-foreground">Movies</h1>
                {/* Responsive Grid:
                   - default: 1 column (Mobile)
                   - md: 2 columns (Tablet)
                   - lg: 3 columns (Desktop)
                   - xl: 4 columns (Large Desktop)
                */}
                <MovieList movies={movies} />
            </div>
        </main>
    );
}

