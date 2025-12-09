import Database from 'better-sqlite3';
import path from 'path';

// Get the project root directory (one level up from src/lib)
const projectRoot = path.join(process.cwd());
const dbPath = path.join(projectRoot, 'game-session.db');

// Initialize database connection
let db: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    
    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS game_session (
        id INTEGER PRIMARY KEY DEFAULT 1,
        current_game_path TEXT,
        is_playing BOOLEAN DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (id = 1)
      )
    `);
    
    // Insert default row if it doesn't exist
    const existing = db.prepare('SELECT id FROM game_session WHERE id = 1').get();
    if (!existing) {
      db.prepare(`
        INSERT INTO game_session (id, current_game_path, is_playing, updated_at)
        VALUES (1, NULL, 0, CURRENT_TIMESTAMP)
      `).run();
    }
  }
  return db;
}

export interface GameSession {
  id: number;
  current_game_path: string | null;
  is_playing: boolean;
  updated_at: string;
}

export function getGameSession(): GameSession {
  const database = getDatabase();
  const session = database.prepare('SELECT * FROM game_session WHERE id = 1').get() as GameSession;
  return session;
}

export function setGameSession(gamePath: string | null, isPlaying: boolean): void {
  const database = getDatabase();
  database.prepare(`
    UPDATE game_session 
    SET current_game_path = ?, is_playing = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(gamePath, isPlaying ? 1 : 0);
}

export function clearGameSession(): void {
  const database = getDatabase();
  database.prepare(`
    UPDATE game_session 
    SET current_game_path = NULL, is_playing = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run();
}
