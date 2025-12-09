import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: Request) {
  try {
    // Execute the Dolphin emulator command with -n flag to open Wii menu
    // Using spawn with detached: true to run in background
    const child = spawn('flatpak', [
      'run',
      'org.DolphinEmu.dolphin-emu',
      '-n',
      '0000000100000002'
    ], {
      detached: true,
      stdio: 'ignore' // Ignore stdio so it doesn't block
    });

    // Unref the child process so the parent can exit independently
    child.unref();

    console.log('Launching Dolphin emulator to menu');
    
    return NextResponse.json({ 
      success: true, 
      message: `Dolphin emulator launched successfully`
    });
  } catch (error) {
    console.error('Error launching Dolphin emulator:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
