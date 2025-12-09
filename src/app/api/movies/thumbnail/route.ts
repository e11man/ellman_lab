import { NextRequest, NextResponse } from 'next/server';

// For now, return a placeholder image. In the future, you could generate thumbnails from videos
export async function GET(request: NextRequest) {
    // Return a placeholder SVG image
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#1a1a1a"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="#666" text-anchor="middle" dominant-baseline="middle">🎬</text>
            <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="18" fill="#888" text-anchor="middle" dominant-baseline="middle">Movie</text>
        </svg>
    `.trim();
    
    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
        },
    });
}

