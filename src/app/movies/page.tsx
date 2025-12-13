import { scanMovies } from '../../lib/movies-scanner';
import { MoviesPageClient } from './MoviesPageClient';

export default function MoviesPage() {
    const movies = scanMovies();

    return <MoviesPageClient movies={movies} />;
}



