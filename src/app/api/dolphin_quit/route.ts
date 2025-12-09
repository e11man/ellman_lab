import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Kill all dolphin-emu processes
    await execAsync('killall -9 dolphin-emu');
    
    console.log('Dolphin emulator processes terminated');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Game quit successfully'
    });
  } catch (error: any) {
    // If the process doesn't exist, that's okay - it means it's already closed
    if (error.code === 1 && error.message.includes('No such process')) {
      return NextResponse.json({ 
        success: true, 
        message: 'No running Dolphin process found'
      });
    }
    
    console.error('Error quitting Dolphin emulator:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
