import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Execute the Dolphin emulator command
    // Using spawn with detached: true to run in background
    const child = spawn('flatpak', [
      'run',
      'org.DolphinEmu.dolphin-emu',
      '-e',
      filePath
    ], {
      detached: true,
      stdio: 'ignore' // Ignore stdio so it doesn't block
    });

    // Unref the child process so the parent can exit independently
    child.unref();

    console.log(`Launching Dolphin emulator with game: ${filePath}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Game launched successfully`,
      filePath
    });
  } catch (error) {
    console.error('Error launching Dolphin emulator:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
