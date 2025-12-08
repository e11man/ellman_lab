This is a comprehensive SCOPE.md file designed to be placed in the root of your project. It is structured to guide an AI assistant (like GitHub Copilot, Cursor, or ChatGPT) in building your application incrementally.

It defines the long-term vision while focusing intensely on the immediate V1 requirements, providing technical constraints and implementation details to ensure the generated code meets your specific needs.

Project Scope: Anti-Gravity (Local Media Launcher)
Created Date: October 26, 2023 Target Framework: Next.js (App Router preferred)

1. Project Overview & Vision
Anti-Gravity is a locally hosted web application designed to serve as a beautiful, consolidated frontend for browsing and launching local media files.

The long-term vision is a media-agnostic platform capable of ingesting arrays of different media types (Movies, TV Shows, Retro Games) from various local directories, displaying their metadata and cover art, and executing specific OS commands to launch them in their respective players/emulators.

Current Focus (V1): The immediate goal is to build a functional Minimum Viable Product (MVP) focused specifically on Nintendo Wii Games.

2. Versioning Strategy & Roadmap
We will adopt an iterative approach. The AI should focus only on the current active version requirements.
[ACTIVE] Version 1.0: The Wii MVP
Scan a local directory for Wii game files.
Identify games and fetch cover art metadata.
Display games in a responsive grid frontend.
Clicking a game executes a harmless "dummy" OS command (e.g., printing to console).
[FUTURE] Version 1.1: Dolphin Integration
Replace the dummy OS command with the actual command to launch the selected ROM via the Dolphin Emulator executable.
[FUTURE] Version 2.0: Media Abstraction (Movies)
Refactor the backend to handle generic "Media Items" rather than just Wii games.
Implement a second media provider for locally stored Movie files.
3. V1.0 Detailed Requirements & Scope
This section defines the boundaries for the current development phase.

3.1. Technical Stack & Constraints
Framework: Next.js 14+ (using App Router /app directory structure).
Language: TypeScript preferred (for robust data structures), standard JavaScript acceptable if preferred.
Styling: Tailwind CSS (for rapid, "nice looking" UI development).
Backend Environment: Node.js runtime (crucial for filesystem access and OS commands).
Data Persistence: None required for V1. Data should be re-scanned on server start or page refresh.
3.2. Architectural Guidance (Preparing for V2)
To ensure the future requirement of handling movies is met, the AI should structure data handling using a generic interface right from the start.

Instead of hardcoding game-specific properties everywhere, aim for a standard structure passed to the frontend, for example:

TypeScript
// The AI should aim to standardize on a structure similar to this
interface MediaItem {
  id: string;          // Unique identifier (e.g., Wii Game ID)
  title: string;       // Display title
  boxArtUrl: string;   // URL to local image or external URL
  filePath: string;    // Full absolute path to the file on disk
  type: 'wii' | 'movie'; // Discriminator for future use
}
3.3. Functional Implementation Steps (V1)
The AI should execute these steps in order.

Step 1: Configuration & Setup
Initialize a Next.js project with Tailwind CSS.
Define an Environment Variable (e.g., LOCAL_WII_GAMES_PATH) in an .env.local file to store the absolute path to the laptop's games folder.
Step 2: Backend - File Traversal & Identification
Create a server-side utility function (e.g., in lib/wii-scanner.ts).
It must read the configured directory path using Node.js fs.readdir (recursively if necessary, though flat folder is fine for V1 start).
Filter files to only include relevant Wii extensions (e.g., .iso, .wbfs).
Crucial Identification Step: To get accurate cover art, do not rely solely on the filename. The AI should attempt to read the first 6 bytes of the ISO/WBFS file header to extract the unique Game ID (e.g., "RMGE01" for Super Mario Galaxy).
Step 3: Backend - Metadata Fetching
Once the Game ID is extracted, use an external service to get the cover URL.
Suggestion for AI: Use a service like gametdb.com which has predictable URLs based on Game IDs. (e.g., https://art.gametdb.com/wii/cover/US/RMGE01.png).
Construct an array of MediaItem objects containing the ID, discovered Title, constructed Cover URL, and file path.
Step 4: Frontend - Display UI
Create a Next.js Server Component (Page) as the main route.
This component should call the backend utility function to get the array of games.
Pass this data to a Client Component responsible for rendering the grid.
The UI should be a clean, responsive grid displaying the cover art. CSS aspect ratios should handle cover art nicely. Hover states should indicate interactivity.
Step 5: Interaction - Executing OS Commands
Create a Next.js Route Handler (API route, e.g., /api/launch/route.ts).
The frontend client component calls this endpoint via POST when a cover is clicked, passing the filePath or id of the game.
Security Note: This route handler must run entirely on the server.
Use Node.js child_process.exec (or spawn).
V1 Requirement: For this version, the command must not actually run Dolphin. It should run a benign command verifying the path was received.
Windows Example: exec(echo Launching requested for file: "${filePath}")
Mac/Linux Example: exec(echo "Launching requested for file: ${filePath}")
The frontend should show a brief "Launching..." toast notification or state change upon click.
3.4. What is OUT of Scope for V1
Installing or configuring Dolphin emulator.
Scanning movie folders.
A database (SQLite, MongoDB, etc.).
User authentication.


