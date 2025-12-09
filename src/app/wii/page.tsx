import { scanFiles } from '../../lib/games-scanner';
import { GameList } from './GameList';

export default function WiiPage() {
    const files = scanFiles();

    return (
        <main className="min-h-screen bg-background p-4 md:p-8">
            {/* Container to center content on large screens */}
            <div className="container mx-auto">
                
                {/* Responsive Grid:
                   - default: 1 column (Mobile)
                   - md: 2 columns (Tablet)
                   - lg: 3 columns (Desktop)
                   - xl: 4 columns (Large Desktop)
                */}
                <GameList files={files} />
            </div>
        </main>
    );
}
