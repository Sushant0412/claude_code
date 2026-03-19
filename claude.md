# UIGen - AI-Powered UI Generation Tool

UIGen is a sophisticated, AI-driven platform for generating, editing, and previewing React components in real-time. It leverages the Anthropic Claude API to transform natural language descriptions into functional code, providing a seamless development experience with a virtual file system and an integrated preview environment.

## Key Features

- **AI-Powered Code Generation**: Uses Claude (via Anthropic API) to generate React components from user prompts.
- **Virtual File System (VFS)**: Simulates a file system in memory, allowing for complex multi-file projects without constant disk I/O.
- **Real-time Preview**: An integrated preview frame that renders generated components instantly.
- **Monaco Editor Integration**: A full-featured code editor for manual adjustments.
- **Project Persistence**: Projects, messages, and file system states are saved to a SQLite database via Prisma.
- **Glassmorphic UI**: A premium, modern interface with smooth transitions and glassmorphism effects.

## Tech Stack

- **Framework**: Next.js 15.3 (App Router)
- **AI**: AI SDK with Anthropic (Claude-3.5-Sonnet)
- **Database**: Prisma with SQLite
- **UI Components**: Radix UI, Lucide React, Tailwind CSS
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Testing**: Vitest & React Testing Library

## Project Structure

```text
src/
├── actions/             # Server actions for project/user management
├── app/                 # Next.js app router pages and layouts
│   ├── [projectId]/     # Dynamic project routes
│   ├── api/             # API routes (e.g., chat, file operations)
│   ├── main-content.tsx # Main UI layout (Chat, Editor, Preview)
│   └── globals.css      # Global styling & design system
├── components/          # React components
│   ├── auth/            # Authentication components
│   ├── chat/            # Chat interface & message history
│   ├── editor/          # File tree & Monaco editor
│   ├── preview/         # Live preview frame
│   └── ui/              # Reusable Radix UI components
├── lib/                 # Core logic and utilities
│   ├── contexts/        # React contexts (FileSystem, Chat)
│   ├── prompts/         # AI system prompts
│   ├── tools/           # Custom AI tools (read_file, write_file, etc.)
│   ├── file-system.ts   # VirtualFileSystem implementation
│   ├── provider.ts      # AI model provider logic (Anthropic/Mock)
│   └── utils.ts         # General utilities
├── prisma/              # Database schema and migrations
└── tests/               # Unit and integration tests
```

## Data Models

The application uses Prisma with a SQLite database (configured in `prisma/schema.prisma`). The core models are:

### User
- `id` (String): Primary key (CUID)
- `email` (String): Unique identifier
- `password` (String): Hashed password
- `projects` (Project[]): One-to-many relationship with Projects
- `createdAt`, `updatedAt`: Automatic timestamps

### Project
- `id` (String): Primary key (CUID)
- `name` (String): Descriptive name for the project
- `userId` (String, optional): Foreign key to the User (cascading delete)
- `messages` (String, default "[]"): JSON string storing the chat history between the user and AI
- `data` (String, default "{}"): JSON string storing the serialized state of the Virtual File System
- `createdAt`, `updatedAt`: Automatic timestamps

## Core Systems

### Virtual File System (`src/lib/file-system.ts`)
The `VirtualFileSystem` class manages an in-memory tree of files and directories. It supports typical file operations like `createFile`, `readFile`, `updateFile`, `deleteFile`, and `rename`. It also provides methods for serialization and deserialization to persist the state in the database.

### AI Provider (`src/lib/provider.ts`)
The `getLanguageModel` function returns either the actual Anthropic model or a `MockLanguageModel`. The mock model is useful for local development without an API key, providing a scripted multi-step interaction to simulate file generation.

### UI Architecture (`src/app/main-content.tsx`)
The `MainContent` component uses `ResizablePanelGroup` to create a flexible workspace. It wraps the entire application in `FileSystemProvider` and `ChatProvider`, ensuring that the file system state and chat history are accessible across all components.

## Development

### Prerequisites
- Node.js & npm
- SQLite (included with Prisma as `dev.db`)
- Anthropic API Key (optional for mock mode)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your-api-key"
   ```
4. Initialize the database: `npm run setup`
5. Run the development server: `npm run dev`

## Testing
Tests are located in `src/__tests__` and can be run using Vitest:
```bash
npm test
```
