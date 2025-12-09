import { NextResponse } from 'next/server';
import { getGameSession, setGameSession, clearGameSession } from '@/lib/db';

export async function GET() {
  try {
    const session = getGameSession();
    return NextResponse.json({ 
      success: true, 
      session 
    });
  } catch (error) {
    console.error('Error getting game session:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gamePath, isPlaying, clear } = body;

    if (clear) {
      clearGameSession();
      return NextResponse.json({ 
        success: true, 
        message: 'Game session cleared',
        session: getGameSession()
      });
    }

    if (gamePath === undefined || isPlaying === undefined) {
      return NextResponse.json(
        { success: false, error: 'gamePath and isPlaying are required' },
        { status: 400 }
      );
    }

    setGameSession(gamePath, isPlaying);
    const session = getGameSession();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Game session updated',
      session 
    });
  } catch (error) {
    console.error('Error updating game session:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
