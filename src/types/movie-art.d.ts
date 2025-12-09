declare module 'movie-art' {
    interface MovieArtOptions {
        year?: number | null;
        size?: string | null;
        type?: 'movie' | 'tv' | null;
        output?: 'poster' | 'backdrop' | 'all' | null;
    }

    interface MovieArtResult {
        backdrop?: string;
        poster?: string;
    }

    function movieArt(
        query: string,
        options?: MovieArtOptions
    ): Promise<string | MovieArtResult>;

    export default movieArt;
}
