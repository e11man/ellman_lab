import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

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

    // Get the output file path (in the project root)
    const outputPath = path.join(process.cwd(), 'file.txt');
    
    // Write the file path as text to file.txt (not the binary contents)
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, filePath, 'utf-8');
    
    console.log(`File path written to ${outputPath}: ${filePath}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `File contents written to file.txt`,
      outputPath 
    });
  } catch (error) {
    console.error('Error running cat command:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
