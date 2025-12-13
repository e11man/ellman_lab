import { NextRequest, NextResponse } from 'next/server';

const API_URL = "https://db.videasy.net/3/search/multi";

interface SearchResult {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path?: string;
    overview?: string;
}

interface FormattedResult {
    id: number;
    title: string;
    year: string;
    mediaType: 'movie' | 'tv';
    url: string;
    posterUrl: string | null;
    overview: string;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const params = new URLSearchParams({
            query,
            language: 'en',
            page: '1'
        });

        const response = await fetch(`${API_URL}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        const results: SearchResult[] = data.results || [];

        // Filter out people, keep only movies and tv
        const mediaResults = results.filter(
            r => r.media_type === 'movie' || r.media_type === 'tv'
        );

        // Format results
        const formattedResults: FormattedResult[] = mediaResults.map(item => {
            const title = item.title || item.name || 'Unknown';
            const releaseDate = item.release_date || item.first_air_date || '';
            const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
            const mediaType = item.media_type as 'movie' | 'tv';
            const url = `https://www.cineby.gd/${mediaType}/${item.id}`;
            const posterUrl = item.poster_path 
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : null;

            return {
                id: item.id,
                title,
                year,
                mediaType,
                url,
                posterUrl,
                overview: item.overview || ''
            };
        });

        return NextResponse.json({ results: formattedResults });
    } catch (error) {
        console.error('Error searching external API:', error);
        return NextResponse.json(
            { error: 'Failed to search external API' },
            { status: 500 }
        );
    }
}
