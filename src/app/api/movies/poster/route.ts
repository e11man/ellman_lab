import { NextRequest, NextResponse } from 'next/server';

// TMDB API key (public, from movie-art package)
const TMDB_API_KEY = '9d2bff12ed955c7f1f74b83187f188ae';
const TMDB_BASE_URL = 'https://api.themoviedb.org';

async function getTMDBConfiguration() {
    const url = `${TMDB_BASE_URL}/3/configuration?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url, { method: 'GET' });
    
    if (!response.ok) {
        throw new Error(`TMDB configuration failed: ${response.statusText}`);
    }
    
    const json = await response.json();
    
    if (json && typeof json.status_message !== 'undefined') {
        throw new Error(`TMDB Error: ${json.status_message}`);
    }
    
    return {
        baseURL: json.images.base_url,
        sizes: json.images.poster_sizes
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get('title');
    const year = searchParams.get('year');

    if (!title) {
        return NextResponse.json(
            { error: 'Title parameter is required' },
            { status: 400 }
        );
    }

    try {
        // Get TMDB configuration
        const { baseURL, sizes } = await getTMDBConfiguration();
        
        // Build search URL
        const searchUrl = `${TMDB_BASE_URL}/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
        
        // Search for the movie
        const searchResponse = await fetch(searchUrl, { method: 'GET' });
        
        if (!searchResponse.ok) {
            throw new Error(`TMDB search failed: ${searchResponse.statusText}`);
        }
        
        const searchJson = await searchResponse.json();
        
        if (searchJson && typeof searchJson.status_message !== 'undefined') {
            throw new Error(`TMDB Error: ${searchJson.status_message}`);
        }
        
        if (!searchJson.results || searchJson.results.length === 0) {
            // If no results with year, try without year
            if (year) {
                const retryUrl = `${TMDB_BASE_URL}/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
                const retryResponse = await fetch(retryUrl, { method: 'GET' });
                const retryJson = await retryResponse.json();
                
                if (retryJson.results && retryJson.results.length > 0) {
                    const posterPath = retryJson.results[0].poster_path;
                    if (posterPath) {
                        const size = sizes[sizes.length - 1]; // Use largest available size
                        const posterUrl = `${baseURL}${size}${posterPath}`;
                        return NextResponse.json({ posterUrl });
                    }
                }
            }
            
            return NextResponse.json(
                { error: 'Poster not found' },
                { status: 404 }
            );
        }
        
        // Get the first result's poster
        const posterPath = searchJson.results[0].poster_path;
        if (!posterPath) {
            return NextResponse.json(
                { error: 'Poster not found' },
                { status: 404 }
            );
        }
        
        // Use the largest available size
        const size = sizes[sizes.length - 1];
        const posterUrl = `${baseURL}${size}${posterPath}`;
        
        return NextResponse.json({ posterUrl });
    } catch (error) {
        console.error('Error fetching movie art:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch movie art' },
            { status: 500 }
        );
    }
}
