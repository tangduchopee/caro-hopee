# Cờ Caro Game Platform

A real-time multiplayer Tic-Tac-Toe (Cờ Caro) game platform built with React 18 & Node.js. Play authenticated or as guest, compete on the leaderboard, and enjoy configurable game rules.

**Status**: Active Development | **Last Updated**: December 2025

## Quick Start

### Prerequisites
- Node.js 16+, npm or yarn
- MongoDB (local or Atlas)

### Run Locally (2 terminals)

**Terminal 1 - Backend:**
```bash
cd backend && npm install && npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm install && npm start
# Runs on http://localhost:3000
```

### Environment Setup

**backend/.env**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/caro-game
JWT_SECRET=dev-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Features

### Core Gameplay
- **Real-time Multiplayer**: WebSocket-powered live games
- **Configurable Board Sizes**: 15x15, 19x19, 20x20 (and custom)
- **Win Detection**: Automatic 5-in-a-row checker with visual highlight
- **Guest & Authenticated Play**: No account required or track stats

### Game Controls
- **Surrender**: Give up and lose immediately
- **Undo System**: Request opponent approval (max 3/game)
- **Block Two Ends Rule**: Optional tactical rule (Chặn 2 đầu)
- **Leave & Reconnect**: Rejoin games within 5-minute window

### Social Features
- **Leaderboard**: Top 100 players ranked by score
- **Game History**: View replays of past games
- **User Profiles**: Track stats (wins, losses, draw rate)
- **Room Codes**: 6-char shareable game invites

## Tech Stack

| Layer | Tech | Version |
|-------|------|---------|
| **Frontend** | React, TypeScript, MUI | 18, 4.9, 7.3 |
| **Backend** | Node.js, Express, TypeScript | LTS, 4.18, 5.3 |
| **Database** | MongoDB, Mongoose | Atlas, 8.0 |
| **Real-time** | Socket.IO | 4.7 |
| **Auth** | JWT, bcryptjs | jsonwebtoken 9.0, 2.4 |

## Architecture

**Monorepo Structure**
```
carro-game/
├── backend/src/
│   ├── controllers/   # HTTP request handlers
│   ├── services/      # Business logic (gameEngine, winChecker, etc.)
│   ├── models/        # MongoDB schemas (User, Game, GameHistory, etc.)
│   ├── routes/        # Express route definitions
│   ├── middleware/    # Auth, rate limiting, error handling
│   ├── config/        # Database & Socket.IO setup
│   └── types/         # TypeScript interfaces
│
├── frontend/src/
│   ├── components/    # UI (GameBoard, GameCard, etc.)
│   ├── contexts/      # State (AuthContext, GameContext, SocketContext)
│   ├── pages/         # Routes (Home, Game, Leaderboard, Profile)
│   ├── services/      # API client & Socket.IO client
│   └── utils/         # Helpers (room codes, guest IDs, logger)
│
├── docs/              # Documentation
└── repomix-output.xml # Full codebase dump for AI analysis
```

## API Overview

### Authentication
```
POST   /api/auth/register      # Create account
POST   /api/auth/login         # Get JWT token
GET    /api/auth/me            # Verify token
```

### Games
```
POST   /api/games/create       # New game
GET    /api/games/:roomId      # Get game state
POST   /api/games/:roomId/join # Join existing
GET    /api/games/user/:userId # Game history
```

### Social
```
GET    /api/leaderboard        # Top 100 players
GET    /api/users/:userId      # User profile
GET    /api/stats/:userId      # Detailed statistics
```

## WebSocket Events

**Client → Server**: `join-room`, `make-move`, `request-undo`, `approve-undo`, `surrender`, `leave-room`

**Server → Client**: `player-joined`, `move-made`, `game-finished`, `undo-requested`, `score-updated`, `game-error`

## Game Rules

1. **5 in a Row**: Win by placing 5 consecutive pieces (horizontal, vertical, diagonal)
2. **Block Two Ends** (Optional): Prevents moves creating exploitable patterns
3. **Undo** (Optional): Players can request to undo last move (opponent approval required, max 3/game)
4. **Draw**: Declared when board full with no winner

## Development Commands

```bash
# Backend
npm run dev       # Development server (hot reload)
npm run build     # Compile TypeScript
npm start         # Run production build
npm run migrate:stats    # Run database migrations
npm run init:gametypes   # Initialize game templates

# Frontend
npm start         # Development server
npm run build     # Production build
npm test          # Run tests
```

## Documentation

- **[docs/project-overview-pdr.md](docs/project-overview-pdr.md)** - Requirements & features
- **[docs/system-architecture.md](docs/system-architecture.md)** - System design & data flows
- **[docs/code-standards.md](docs/code-standards.md)** - Development conventions
- **[docs/codebase-summary.md](docs/codebase-summary.md)** - Code organization overview
- **[GAME_FEATURES_AND_LOGIC.md](GAME_FEATURES_AND_LOGIC.md)** - Detailed game mechanics
- **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** - Full technical design

## Performance

- **API Latency**: < 200ms (p99)
- **WebSocket Events**: < 100ms
- **Page Load**: < 2s (FCP)
- **Concurrent Connections**: Supports 1000+ users
- **Database**: Optimized with compound indexes

## Security

- **Passwords**: bcryptjs hashing (salt rounds ≥ 10)
- **Authentication**: JWT (7-day expiry, no refresh tokens)
- **Moves**: Server-authoritative validation
- **Rate Limiting**: Applied to auth endpoints
- **Anti-Cheat**: Move validation, rate limiting, duplicate prevention

## Deployment

**Current Setup** (Development)
- Frontend: Local npm (port 3000)
- Backend: Local npm (port 5000)
- Database: MongoDB local or Atlas

**Production** (Recommended)
- Frontend: Vercel
- Backend: Railway or Render
- Database: MongoDB Atlas

## Project Status

### Completed
- User registration & JWT auth
- Real-time game creation & joining
- Game state management & move validation
- WebSocket synchronization
- Leaderboard & statistics
- Game history & replay
- Responsive mobile UI

### In Progress / Planned
- Unit & E2E tests
- Multi-game support (templates)
- Performance optimization (Redis caching)
- Notification system
- Tournament brackets
- ELO rating system

## Troubleshooting

**MongoDB Connection Error**: Check `MONGODB_URI` in backend/.env and ensure MongoDB is running

**WebSocket Disconnection**: Backend crashed or network issue. Check terminal logs and restart with `npm run dev`

**CORS Issues**: Verify `FRONTEND_URL` in backend/.env and `REACT_APP_API_BASE_URL` in frontend/.env

**Port Already in Use**: Change `PORT=5001` in backend/.env or `PORT=3001` in frontend/.env

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: Follow conventional commits (`feat:`, `fix:`, `docs:`)
3. Test locally: Run dev servers and validate flows
4. Push and create PR with clear description

See [docs/code-standards.md](docs/code-standards.md) for coding conventions.

## License

ISC

---

**Questions?** Check the [docs/](docs/) folder or existing issues. Last updated: December 21, 2025
