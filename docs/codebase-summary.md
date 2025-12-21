# Codebase Summary

## Project Overview
**Cờ Caro Game Hub** - A real-time multiplayer Tic-Tac-Toe (Caro) game platform built with React + Node.js, supporting both authenticated and guest gameplay with comprehensive game history tracking.

## Repository Stats
- **Total Files**: 85 files
- **Total Tokens**: ~110,675 tokens (compact code)
- **Architecture**: Monorepo (Frontend + Backend)
- **Primary Language**: TypeScript (100% typesafe)

## Directory Structure

```
.
├── backend/                      # Node.js/Express backend
│   ├── src/
│   │   ├── config/              # Database & Socket.IO config
│   │   ├── controllers/         # Route handlers (5 types)
│   │   ├── middleware/          # Auth, rate limiting, error handling
│   │   ├── models/              # MongoDB schemas (8 models)
│   │   ├── routes/              # Express routes (5 route sets)
│   │   ├── services/            # Business logic (5 services)
│   │   ├── scripts/             # Migration & init scripts
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # JWT utilities
│   │   └── server.ts            # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React web application
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── GameBoard/       # Board rendering & cell logic
│   │   │   ├── GameCard/        # Game list card display
│   │   │   ├── GameControls/    # Action buttons (surrender, undo, etc)
│   │   │   ├── GameInfo/        # Game status & player info
│   │   │   ├── HistoryModal/    # Game history viewer
│   │   │   └── RoomCodeDisplay/ # Copy room code
│   │   ├── contexts/            # State management
│   │   │   ├── AuthContext      # User authentication
│   │   │   ├── GameContext      # Game state & logic
│   │   │   └── SocketContext    # WebSocket connection
│   │   ├── pages/               # Page components (6 pages)
│   │   ├── services/            # API & Socket clients
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Helpers (room codes, guest IDs, logger)
│   │   ├── App.tsx              # Router & theme setup
│   │   └── index.tsx            # React entry point
│   ├── public/                  # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # Documentation (this folder)
├── GAME_FEATURES_AND_LOGIC.md   # Game rules & mechanics
├── SYSTEM_ARCHITECTURE.md       # Full system design
├── MIGRATION_GUIDE.md           # Database migration guide
├── README.md                    # Quick start guide
└── repomix-output.xml           # Full codebase dump
```

## Technology Stack

### Frontend
- **React 18**: UI library with hooks & suspense
- **TypeScript**: Type safety
- **Material-UI (MUI v7)**: Component library
- **React Router v7**: Navigation (Data Router API)
- **Socket.IO Client**: Real-time WebSocket
- **Axios**: HTTP client

### Backend
- **Node.js + Express**: HTTP server
- **TypeScript**: Type safety
- **MongoDB + Mongoose**: Document database with ODM
- **Socket.IO**: Real-time communication
- **JWT (jsonwebtoken)**: Stateless authentication (7-day expiry)
- **bcryptjs**: Password hashing

### DevOps
- **Database**: MongoDB Atlas (cloud)
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway/Render
- **Port Config**: Backend 5000-5001, Frontend 3000

## Key Features

### Game Modes
- **Authenticated Play**: Register/Login → Persistent stats
- **Guest Play**: No signup → Temporary localStorage history
- **Real-time Multiplayer**: WebSocket-based live gameplay

### Board Variants
- 3x3 (mini)
- 15x15 (standard)
- 19x19 (Go-like)
- 20x20 (tournament)

### Game Rules
- **Win Condition**: 5 in a row (any direction)
- **Block Two Ends**: Prevents certain tactical openings
- **Undo System**: Request-approve flow (max 3/game)
- **Move Tracking**: Full game history with timestamps

### User Features
- **Leaderboard**: Ranked by score (ELO-style)
- **Game History**: Replay past games
- **Win Checker**: Visual line highlighting
- **Room Codes**: 6-char alphanumeric game invite codes

## Database Models (8 total)

1. **User** - Authenticated player accounts (username, email, password)
2. **Game** - Active game state (board, status, players, rules)
3. **GameHistory** - Archived games (permanent record)
4. **GameStats** - Player statistics (per user, per game type)
5. **GameSession** - Socket session mapping
6. **GameMove** - Individual move records
7. **GameType** - Game configuration templates
8. **Leaderboard** - Cached player rankings

## Backend Services (5 total)

1. **socketService** - WebSocket event handlers, game state sync
2. **gameEngine** - Game initialization, board manipulation
3. **ruleEngine** - Win detection, move validation, block two ends
4. **winChecker** - Consecutive piece detection
5. **antiCheatService** - Move validation, rate limiting, duplicate prevention

## Frontend Contexts (3 total)

1. **AuthContext** - Login/logout, JWT token management
2. **GameContext** - Game state, move dispatch, history tracking
3. **SocketContext** - WebSocket connection & event binding

## API Routes

```
/api/auth
  POST /register       - Create account
  POST /login          - Generate JWT token
  GET  /me             - Verify token

/api/games
  POST /create         - New game (returns roomId)
  GET  /:roomId        - Get game state
  POST /:roomId/join   - Join existing game
  GET  /user/:userId   - User's game history

/api/leaderboard
  GET  /               - Top 100 players
  GET  /user/:userId   - User's rank

/api/users
  GET  /:userId        - Profile data
  PUT  /:userId        - Update profile

/api/stats
  GET  /user/:userId   - Detailed game stats
```

## WebSocket Events

**Client → Server**
- `join-room` - Enter game lobby
- `leave-room` - Exit game
- `make-move` - Place piece (x, y coords)
- `request-undo` - Ask opponent to undo
- `approve-undo` / `reject-undo` - Respond to undo
- `surrender` - Give up game
- `new-game` - Rematch in same room

**Server → Client**
- `room-joined` - Confirmed entry
- `player-joined` / `player-left` - Opponent status
- `move-made` - Piece placed + board state
- `game-finished` - Result (win/loss/draw)
- `score-updated` - Stats refresh
- `undo-requested` / `undo-approved` / `undo-rejected`
- `game-error` - Validation failure

## Authentication Flow

```
User Registration/Login
        ↓
JWT Token Generated (7-day expiry)
        ↓
Token Stored in localStorage
        ↓
Request Header: Authorization: Bearer <token>
        ↓
Middleware Validates Token
        ↓
Route Handler Executes
        ↓
Token Expired → Logout & Redirect to /login
```

## State Management Strategy

- **Auth**: Context API (global user state)
- **Game**: Context API + local state (board, moves, UI)
- **Socket**: Context API (single connection instance)
- **Cache**: localStorage for guest history + JWT
- **Server**: MongoDB for persistence

## File Size Distribution

Top 5 Largest Files:
1. `socketService.ts` (25KB) - 80% of WebSocket logic
2. `GameContext.tsx` (29KB) - Game state & logic
3. `ruleEngine.ts` (5KB) - Move validation
4. `SYSTEM_ARCHITECTURE.md` (25KB) - Full design doc
5. `GAME_FEATURES_AND_LOGIC.md` (28KB) - Feature specs

## Performance Optimizations

- **React**: memo() on cards, lazy loading pages
- **Routing**: Data Router for optimized navigation
- **WebSocket**: Event debouncing, move coalescing
- **Board**: Virtual grid rendering (for large boards)
- **Auth**: JWT tokens (no session cookies)
- **Database**: Compound indexes on frequent queries

## Development Scripts

**Backend**
```bash
npm run dev              # Development with hot reload
npm run build            # TypeScript compilation
npm start                # Run compiled JS
npm run migrate:stats    # Run user stats migration
npm run init:gametypes   # Initialize game type templates
```

**Frontend**
```bash
npm start                # Development server + hot reload
npm run build            # Production build
npm test                 # Run test suite
```

## Environment Variables

**Backend** (.env)
```
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=<secret>
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** (.env)
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Known Technical Debt

- **Refresh Token**: Not implemented (7-day JWT expiry only)
- **Testing**: No test suite (echo "Error: no test specified")
- **Rate Limiting**: Basic limiter on /auth routes only
- **WebSocket**: Large socketService file needs splitting
- **Legacy Fields**: User model has deprecated stats fields

## Security Considerations

- **Passwords**: bcryptjs with default salt rounds
- **Tokens**: JWT with 7-day expiry (no refresh token)
- **CORS**: Open CORS config (configure origin in production)
- **Rate Limiting**: Applied to /auth endpoints
- **Move Validation**: Backend-enforced game rules
- **Room Codes**: 6-char alphanumeric (not cryptographically secure)

## Scalability Notes

- **Monolith + Modules**: Ready for extraction to microservices
- **WebSocket**: Socket.IO scales horizontally with Redis adapter (not configured)
- **Database**: MongoDB Atlas handles scaling
- **Frontend**: Vercel auto-scales with edge network
- **Future Games**: GameType model supports new game types (templates)

## Next Steps for Developers

1. Read `SYSTEM_ARCHITECTURE.md` for deep design understanding
2. Review `GAME_FEATURES_AND_LOGIC.md` for game rules
3. Start with `backend/src/server.ts` entry point
4. Explore WebSocket flow via `services/socketService.ts`
5. Check `frontend/src/contexts/GameContext.tsx` for game logic
6. Run migrations with npm scripts if upgrading database

## Documentation Files

- **README.md** - Quick start & setup
- **SYSTEM_ARCHITECTURE.md** - System design & flows
- **GAME_FEATURES_AND_LOGIC.md** - Game rules & mechanics
- **MIGRATION_GUIDE.md** - Database migration steps
- **docs/codebase-summary.md** - This file (high-level overview)
- **docs/code-standards.md** - Coding conventions & patterns
- **docs/project-overview-pdr.md** - Requirements & goals
- **docs/system-architecture.md** - Architecture details

## Quick Commands

```bash
# Start services locally
cd backend && npm run dev     # Terminal 1
cd frontend && npm start      # Terminal 2

# Build for production
cd backend && npm run build && npm start
cd frontend && npm run build

# View game logs (frontend)
npm run dev -- --verbose

# Reset guest history
localStorage.clear()
```
