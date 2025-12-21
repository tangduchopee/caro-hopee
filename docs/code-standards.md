# Code Standards & Codebase Structure

## Overview
This document defines coding conventions, file organization patterns, and architectural guidelines for maintaining code quality and consistency.

## Language: TypeScript

### Compiler Configuration
- **Mode**: Strict (strict: true in tsconfig.json)
- **Target**: ES2020+
- **Module**: CommonJS (Node.js), ES Modules (Frontend)
- **No Implicit Any**: Enforced
- **Strict Null Checks**: Enforced
- **Strict Function Types**: Enforced

### Type Definitions Best Practices

**1. Explicit Interfaces for Models**
```typescript
// ✓ Good
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

// ✗ Avoid
const user = {} as any;
```

**2. Enum Over String Unions (when stable)**
```typescript
// ✓ For concrete values
export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

// ✓ For type definitions (more flexible)
export type GameStatus = 'waiting' | 'playing' | 'finished';
```

**3. Strict Null/Undefined**
```typescript
// ✓ Good - explicit handling
const player1: IUser | null = game.player1;
if (player1) { /* use player1 */ }

// ✗ Avoid
const player1: any = game.player1;
```

**4. No Implicit Any**
```typescript
// ✓ Good
const calculateScore = (wins: number, losses: number): number => wins * 10 - losses * 5;

// ✗ Avoid
const calculateScore = (wins, losses) => wins * 10 - losses * 5;
```

## Backend Structure

### Directory Organization

```
backend/src/
├── config/              # Configuration & initialization
├── controllers/         # Route handlers (request/response)
├── middleware/          # Express middleware (auth, logging, error)
├── models/              # MongoDB schemas & interfaces
├── routes/              # Express route definitions
├── services/            # Business logic & external services
├── scripts/             # One-off migration/initialization scripts
├── types/               # Global TypeScript type definitions
├── utils/               # Utility functions (JWT, helpers)
└── server.ts            # Entry point
```

### Controller Pattern

```typescript
// ✓ Good - Controllers handle HTTP protocol
import { Request, Response, NextFunction } from 'express';

export const createGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { boardSize } = req.body;
    const game = await gameService.createGame(boardSize);
    res.status(201).json({ success: true, data: game });
  } catch (error) {
    next(error); // Pass to error handler
  }
};

// ✗ Avoid - Don't mix protocol with business logic
export const createGame = (io: any) => {
  io.on('create-game', (data: any) => {
    // Avoid complex logic here
  });
};
```

### Service Pattern (Business Logic)

```typescript
// ✓ Good - Services contain reusable logic
export class GameService {
  async createGame(boardSize: number): Promise<IGame> {
    const game = new Game({
      boardId: generateUUID(),
      boardSize,
      board: initializeBoard(boardSize),
      gameStatus: 'waiting',
    });
    return game.save();
  }

  async makeMove(gameId: string, player: number, x: number, y: number): Promise<void> {
    const game = await Game.findById(gameId);
    if (!game) throw new NotFoundError('Game not found');
    // Validation & state changes
    game.board[x][y] = player;
    await game.save();
  }
}

// Use in controllers
const gameService = new GameService();
```

### Model Schema Pattern

```typescript
// ✓ Good - Define both Interface & Schema
export interface IGame extends Document {
  roomId: string;
  player1: mongoose.Types.ObjectId | null;
  board: number[][];
  gameStatus: 'waiting' | 'playing' | 'finished';
}

const GameSchema = new Schema({
  roomId: { type: String, required: true, unique: true },
  player1: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  board: { type: [[Number]], required: true },
  gameStatus: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting',
  },
});

// Add computed properties
GameSchema.virtual('playerCount').get(function() {
  return (this.player1 ? 1 : 0) + (this.player2 ? 1 : 0);
});

export default mongoose.model<IGame>('Game', GameSchema);
```

### Middleware Pattern

```typescript
// ✓ Good - Middleware for cross-cutting concerns
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Extend Request type
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply to routes
app.get('/api/profile', authMiddleware, profileController.getProfile);
```

### Error Handling

```typescript
// ✓ Good - Centralized error handling
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
  } else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  } else {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Define custom errors
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Use in services
if (!game) throw new NotFoundError('Game not found');
```

### Socket.IO Service Pattern

```typescript
// ✓ Good - Organize WebSocket logic by domain
export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      io.to(roomId).emit('player-joined', { playerId: socket.id });
    });

    socket.on('make-move', (data: { x: number; y: number }) => {
      handleMove(socket, data);
    });
  });
};

// ✗ Avoid - Mixing concerns
const setupSocket = (io: any) => {
  io.on('connection', (socket: any) => {
    socket.on('any-event', (data: any) => {
      // Complex game logic + database + response handling = messy
    });
  });
};
```

## Frontend Structure

### Directory Organization

```
frontend/src/
├── components/          # Reusable UI components
├── contexts/            # React Context providers
├── pages/               # Page-level components
├── services/            # API & external services
├── types/               # TypeScript interfaces
├── utils/               # Utility functions & helpers
├── App.tsx              # Root component with routing
└── index.tsx            # React entry point
```

### Component Conventions

**1. Functional Components with TypeScript**
```typescript
// ✓ Good - Clear props interface, memo for optimization
import React, { memo } from 'react';

interface GameBoardProps {
  board: number[][];
  onCellClick: (x: number, y: number) => void;
  gameStatus: 'playing' | 'finished';
}

const GameBoard: React.FC<GameBoardProps> = memo(({ board, onCellClick, gameStatus }) => {
  return (
    <div className="game-board">
      {board.map((row, x) => (
        <div key={x} className="board-row">
          {row.map((cell, y) => (
            <Cell
              key={`${x}-${y}`}
              value={cell}
              onClick={() => gameStatus === 'playing' && onCellClick(x, y)}
            />
          ))}
        </div>
      ))}
    </div>
  );
});

GameBoard.displayName = 'GameBoard'; // For debugging
export default GameBoard;
```

**2. Context API Pattern**
```typescript
// ✓ Good - Strong typing, error boundaries
import React, { createContext, useContext, useState } from 'react';

interface IGameContext {
  board: number[][];
  makeMove: (x: number, y: number) => Promise<void>;
  resetGame: () => void;
}

const GameContext = createContext<IGameContext | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [board, setBoard] = useState<number[][]>(initBoard());

  const makeMove = async (x: number, y: number): Promise<void> => {
    // Validate & make move
  };

  return (
    <GameContext.Provider value={{ board, makeMove, resetGame: () => setBoard(initBoard()) }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): IGameContext => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be within GameProvider');
  return context;
};
```

**3. Hook Best Practices**
```typescript
// ✓ Good - Custom hooks for logic reuse
export const useGameSocket = (roomId: string) => {
  const [board, setBoard] = useState<number[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io();
    socket.on('move-made', (data) => setBoard(data.board));
    socket.on('error', (data) => setError(data.message));
    return () => socket.off('move-made');
  }, [roomId]);

  return { board, error };
};

// Use in component
const GameRoom = ({ roomId }: { roomId: string }) => {
  const { board, error } = useGameSocket(roomId);
  // Component logic
};
```

**4. Routing Pattern (React Router v7 Data Router)**
```typescript
// ✓ Good - Route definitions with data loaders
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/game/:roomId',
    element: <GameRoomPage />,
    loader: async ({ params }) => {
      // Fetch game data before rendering
      return await fetchGame(params.roomId);
    },
  },
  {
    path: '/profile',
    element: <ProfilePage />,
    loader: async () => {
      return await fetchUserProfile();
    },
  },
]);
```

### State Management

**Preferred: Context API + Hooks**
```typescript
// ✓ For authentication state
export const useAuth = () => {
  const { user, login, logout } = useContext(AuthContext);
  return { user, login, logout };
};

// ✓ For game state
export const useGame = () => {
  const context = useContext(GameContext);
  return context; // Throw error if undefined
};
```

**Avoid: Redux for this project**
- Context API sufficient for current complexity
- Redux adds boilerplate without proportional benefit
- Consider Redux when > 10 nested contexts needed

### Component File Organization

```typescript
// game-board.tsx - One file per component

// 1. Imports
import React, { memo, useCallback } from 'react';
import { Box, Paper } from '@mui/material';

// 2. Types/Interfaces
interface GameBoardProps {
  board: number[][];
  onCellClick: (x: number, y: number) => void;
}

// 3. Component
const GameBoard: React.FC<GameBoardProps> = memo(({ board, onCellClick }) => {
  const handleCellClick = useCallback(
    (x: number, y: number) => { onCellClick(x, y); },
    [onCellClick]
  );

  return <Box className="game-board">{/* JSX */}</Box>;
});

// 4. Display name (for debugging)
GameBoard.displayName = 'GameBoard';

// 5. Export
export default GameBoard;
```

### API Service Pattern

```typescript
// ✓ Good - Type-safe API client
import axios, { AxiosInstance } from 'axios';

interface IGameService {
  createGame(boardSize: number): Promise<Game>;
  getGame(roomId: string): Promise<Game>;
  joinGame(roomId: string): Promise<Game>;
}

class GameService implements IGameService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL,
    });
  }

  async createGame(boardSize: number): Promise<Game> {
    const { data } = await this.api.post('/games/create', { boardSize });
    return data;
  }

  async getGame(roomId: string): Promise<Game> {
    const { data } = await this.api.get(`/games/${roomId}`);
    return data;
  }
}

export const gameService = new GameService();
```

## Common Patterns & Conventions

### Naming Conventions

**Files & Directories**
```
✓ kebab-case for files:        game-board.tsx, auth-context.tsx
✓ PascalCase for components:   <GameBoard />, <AuthContext.Provider>
✓ camelCase for utilities:     calculateScore(), formatTime()
✓ UPPER_SNAKE_CASE for constants:  MAX_BOARD_SIZE, API_TIMEOUT
```

**Variables & Functions**
```typescript
// ✓ Good - Clear, descriptive names
const maxUndoPerGame = 3;
const playerCount = game.players.length;
const isGameFinished = game.status === 'finished';
const handlePlayerMove = (x: number, y: number): void => { };

// ✗ Avoid
const max = 3;
const count = 42; // What is being counted?
const status = true; // What status?
const h = (a: number, b: number) => { }; // Unreadable
```

**Boolean Variables**
```typescript
// ✓ Prefix with is/has/can
const isPlaying = gameStatus === 'playing';
const hasWon = winner !== null;
const canUndo = undoCount < maxUndo;
```

### Comments & Documentation

**1. When to Comment**
```typescript
// ✓ Why, not what (code shows "what")
// Block Two Ends rule: prevent moves that give opponent open 4
const isBl lockTwoEndsViolation = checkBlockTwoEnds(x, y);

// ✗ Redundant comment
const x = 5; // Set x to 5
```

**2. JSDoc for Public Functions**
```typescript
/**
 * Calculate player score based on game result
 * @param winner - Player ID (1 or 2) or null for draw
 * @returns Score delta (can be negative)
 */
export const calculateScoreDelta = (winner: PlayerNumber | null): number => {
  if (winner === 1) return 10;
  if (winner === 2) return 10;
  return 2; // Draw
};

// Components
interface GameCardProps {
  /** Game ID for navigation */
  gameId: string;
  /** Called when player joins game */
  onJoin: (gameId: string) => void;
}
```

**3. Complex Logic Comments**
```typescript
// ✓ Explain the "why"
// Prevent zoom on trackpad (Ctrl+Scroll) and touch pinch
if (e instanceof WheelEvent && (e.ctrlKey || e.metaKey)) {
  e.preventDefault();
}
```

### Error Handling

**Backend**
```typescript
// ✓ Structured error responses
res.status(400).json({
  error: 'Invalid move',
  message: 'Cell already occupied',
  code: 'CELL_OCCUPIED',
});

// ✗ Avoid
res.status(500).json({ error: 'Something went wrong' });
```

**Frontend**
```typescript
// ✓ Error handling with user feedback
try {
  await gameService.createGame(boardSize);
} catch (error) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 400) {
      setError('Invalid board size');
    } else {
      setError('Server error, please try again');
    }
  }
}
```

### Testing Conventions

**Backend (Jest)**
```typescript
describe('GameService', () => {
  describe('createGame', () => {
    it('should create game with valid board size', async () => {
      const game = await gameService.createGame(15);
      expect(game).toHaveProperty('roomId');
      expect(game.boardSize).toBe(15);
    });

    it('should throw error on invalid board size', async () => {
      await expect(gameService.createGame(100)).rejects.toThrow();
    });
  });
});
```

**Frontend (React Testing Library)**
```typescript
describe('GameBoard', () => {
  it('should render board and handle cell click', () => {
    const mockClick = jest.fn();
    const board = [[0, 0], [0, 0]];

    render(<GameBoard board={board} onCellClick={mockClick} />);

    fireEvent.click(screen.getByTestId('cell-0-0'));
    expect(mockClick).toHaveBeenCalledWith(0, 0);
  });
});
```

## Git & Version Control

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore
**Scope**: auth, game, board, socket, leaderboard, etc.
**Subject**: Imperative, present tense, no caps

**Example**
```
feat(game): implement block two ends rule

Add validation to prevent moves that create patterns with two open ends.
Affects move validation in ruleEngine service.

Closes #42
```

### Branch Naming
```
feature/board-resizing
fix/socket-reconnection
docs/api-endpoints
refactor/game-service
```

## Performance Optimization

### Frontend
- **Memoization**: Use React.memo() for expensive components
- **Lazy Loading**: React.lazy() for route-based code splitting
- **Debouncing**: Debounce move submissions (prevent spam)
- **Caching**: localStorage for JWT & guest history

### Backend
- **Database Indexes**: Compound indexes for frequent queries
- **Connection Pooling**: Reuse DB connections
- **Rate Limiting**: Prevent abuse on auth & move endpoints
- **Caching**: Redis for leaderboard (future optimization)

## Linting & Formatting

**ESLint Configuration**
```json
{
  "extends": ["eslint:recommended"],
  "rules": {
    "no-unused-vars": "warn",
    "no-implicit-any": "error",
    "prefer-const": "warn"
  }
}
```

**Prettier** (Opinionated formatter)
- 2-space indentation
- Single quotes (JS strings)
- Trailing commas (ES5)
- 100-char line length

## Security Practices

### Input Validation
```typescript
// ✓ Validate on backend
export const validateMove = (x: number, y: number, boardSize: number): boolean => {
  if (x < 0 || x >= boardSize) return false;
  if (y < 0 || y >= boardSize) return false;
  return true;
};
```

### Data Sanitization
```typescript
// ✓ Sanitize user input
const sanitizedUsername = username.trim().toLowerCase().slice(0, 20);
```

### Secrets Management
```typescript
// ✓ Use environment variables
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET not set');

// ✗ Avoid
const jwtSecret = 'my-secret-key'; // Hardcoded = vulnerability
```

## Documentation Standards

### README Format
1. **Purpose**: What is this for?
2. **Setup**: Installation & configuration
3. **Usage**: How to use
4. **API/Structure**: Key components
5. **Contributing**: Guidelines for contributors

### Code Comments
- Document "why", not "what"
- Use JSDoc for public APIs
- Keep comments updated with code

## Checklist Before Merge

- [ ] TypeScript compiles without errors
- [ ] No `any` types (unless documented exception)
- [ ] Tests passing (when tests exist)
- [ ] Code follows naming conventions
- [ ] Comments explain complex logic
- [ ] No console.logs left (except logger service)
- [ ] Environment variables documented
- [ ] Error handling complete
- [ ] Security review passed (if auth-related)
- [ ] Performance acceptable (< 200ms API response)

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/
- React Best Practices: https://react.dev/learn
- Express.js Guide: https://expressjs.com/
- MongoDB Schema Design: https://docs.mongodb.com/manual/
- Material-UI Documentation: https://mui.com/
