import { scanFiles } from '../../lib/games-scanner';
import { GameCard } from './GameCard';
import { DolphinMenuCard } from './DolphinMenuCard';
import { WiiMenuCard } from './WiiMenuCard';

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Standalone Dolphin Menu Card */}
                    <DolphinMenuCard />
                    {/* Wii Menu Card */}
                    <WiiMenuCard />
                    {files.map((file, i) => (
                        <div key={file.gameId || i} className="w-full flex items-center justify-center">
                            <GameCard
                                imageSrc={`https://art.gametdb.com/wii/cover/US/${file.gameId}.png`}
                                title={file.fileName}
                                subtitle=""
                                buttonText="Play"
                                filePath={file.filePath}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
