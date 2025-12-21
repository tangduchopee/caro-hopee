# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Router (React Router v7)                                │   │
│  │  ├─ HomePage (Game Browser)                             │   │
│  │  ├─ GameRoomPage (Board + Controls)                     │   │
│  │  ├─ LeaderboardPage                                     │   │
│  │  ├─ ProfilePage                                         │   │
│  │  └─ LoginPage                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Contexts (State Management)                             │   │
│  │  ├─ AuthContext (User + JWT)                            │   │
│  │  ├─ GameContext (Board + Moves)                         │   │
│  │  └─ SocketContext (WebSocket)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services                                                │   │
│  │  ├─ api.ts (Axios REST calls)                          │   │
│  │  └─ socketService.ts (WebSocket client)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           HTTP REST                        WebSocket
              ↓                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (Express)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express Server (Port 5000)                              │   │
│  │  ├─ Routes: /api/auth, /games, /leaderboard, /users    │   │
│  │  ├─ Middleware: Auth, Error Handler, Rate Limiter      │   │
│  │  └─ Socket.IO: Real-time Events                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Controllers (HTTP Handlers)                             │   │
│  │  ├─ authController                                       │   │
│  │  ├─ gameController                                       │   │
│  │  ├─ leaderboardController                               │   │
│  │  └─ userController                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services (Business Logic)                               │   │
│  │  ├─ gameEngine (Create/Join/Move)                        │   │
│  │  ├─ ruleEngine (Validation)                              │   │
│  │  ├─ winChecker (5-in-a-row)                              │   │
│  │  ├─ socketService (WebSocket handlers)                  │   │
│  │  └─ antiCheatService (Rate limit, duplicate check)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Data Layer (Mongoose)                                   │   │
│  │  ├─ Models: User, Game, GameHistory, GameStats, etc    │   │
│  │  └─ Schemas: GameRules, GameScore, etc                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────────────────┐
              │   MongoDB (Database)      │
              │   ├─ Collections          │
              │   ├─ Indexes              │
              │   └─ TTL (if applicable)  │
              └───────────────────────────┘
```

## Authentication Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ POST /api/auth/register {username, email, password}
       ↓
┌─────────────────────────────────────┐
│ Backend: authController.register()  │
│  ├─ Validate input                  │
│  ├─ Hash password (bcryptjs)        │
│  ├─ Save to User collection         │
│  └─ Generate JWT token (7 days)     │
└──────┬──────────────────────────────┘
       │ Response: {token, user}
       ↓
┌─────────────────────────────────────┐
│ Frontend: AuthContext               │
│  ├─ Save token in localStorage      │
│  ├─ Decode token → set user state   │
│  └─ Set Authorization header        │
└──────┬──────────────────────────────┘
       │
       │ Future requests include:
       │ Authorization: Bearer <token>
       ↓
┌────────────────────────────────────┐
│ Backend: authMiddleware            │
│  ├─ Extract token from header      │
│  ├─ Verify signature & expiry      │
│  ├─ Attach user to req.user        │
│  └─ Continue to route handler      │
└────────────────────────────────────┘
```

## Game Creation & Joining Flow

```
┌──────────────────────────────────────────────────────────────┐
│  1. Player 1 Creates Game                                    │
├──────────────────────────────────────────────────────────────┤
│  Frontend: HomePage → Create Game Button                     │
│                       ↓                                       │
│  POST /api/games/create {boardSize: 15}                      │
│                       ↓                                       │
│  Backend: gameController.createGame()                        │
│    ├─ gameEngine.createGame() returns {roomId, roomCode}     │
│    ├─ Game doc created: {status: 'waiting', player1, board}  │
│    └─ Response: {gameId, roomId, roomCode}                   │
│                       ↓                                       │
│  Frontend: Redirects to /game/:roomId                        │
│    ├─ SocketContext connects: socket.io()                    │
│    ├─ Emits: 'join-room' {roomId, userId}                    │
│    └─ GameContext initializes with board                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  2. Player 2 Joins Game                                      │
├──────────────────────────────────────────────────────────────┤
│  Frontend: HomePage → Find Game (by roomCode or roomId)      │
│                       ↓                                       │
│  GET /api/games/{roomId} → Returns game details              │
│                       ↓                                       │
│  POST /api/games/{roomId}/join                               │
│                       ↓                                       │
│  Backend: gameController.joinGame()                          │
│    ├─ Validate game status ('waiting')                       │
│    ├─ Validate not already full (playerCount < 2)            │
│    ├─ Assign player2 = current user                          │
│    ├─ Update game: {status: 'waiting', player1, player2}     │
│    └─ Response: {gameId, updatedGame}                        │
│                       ↓                                       │
│  Frontend: Connect socket & emit 'join-room'                 │
│    ├─ Socket Handler: Room updated {player2 joined}          │
│    ├─ Broadcast to Player 1: 'player-joined' event          │
│    └─ Display "Start Game" button                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  3. Game Start (Both players present)                        │
├──────────────────────────────────────────────────────────────┤
│  Frontend: Click "Start Game" button                         │
│    ├─ Emit: 'start-game' {roomId}                            │
│                       ↓                                       │
│  Backend: socketService handles 'start-game'                 │
│    ├─ Verify both players present                            │
│    ├─ Update Game: {status: 'playing', currentPlayer: 1}     │
│    └─ Broadcast: 'game-started' {board, currentPlayer}      │
│                       ↓                                       │
│  Frontend: Both receive 'game-started'                       │
│    ├─ Display board + game controls                          │
│    ├─ Enable move interaction                                │
│    └─ Highlight current player's turn                        │
└──────────────────────────────────────────────────────────────┘
```

## Game Move Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Player Makes Move (Frontend)                               │
├─────────────────────────────────────────────────────────────┤
│  User clicks board cell (x, y)                              │
│    ↓                                                         │
│  GameBoard component: handleCellClick(x, y)                 │
│    ├─ Check: gameStatus === 'playing'                       │
│    ├─ Check: cell empty                                     │
│    ├─ Emit via socket: 'make-move' {x, y, roomId}           │
│    └─ Optimistic UI: Show move (pending confirmation)       │
└──────┬────────────────────────────────────────────────────────┘
       │ WebSocket Event
       ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend: socketService 'make-move' handler                  │
├──────────────────────────────────────────────────────────────┤
│  1. Fetch game by roomId                                    │
│     ├─ Verify game exists                                   │
│     ├─ Verify game status === 'playing'                     │
│     └─ Verify current player match                          │
│                                                               │
│  2. Validate move                                           │
│     ├─ ruleEngine.validateMove(x, y)                        │
│     │  ├─ Check bounds (0 <= x,y < boardSize)              │
│     │  ├─ Check cell empty (board[x][y] === 0)             │
│     │  └─ Check block two ends (if enabled)                │
│     └─ antiCheatService checks                              │
│        ├─ Rate limit (max 5 moves/sec per player)           │
│        ├─ Duplicate prevention (same move twice)            │
│        └─ Move history validation                           │
│                                                               │
│  3. If Invalid: Emit 'move-error' {message}                 │
│     └─ Frontend: Revert optimistic UI, show error           │
│                                                               │
│  4. If Valid: Place piece                                   │
│     ├─ game.board[x][y] = currentPlayer                     │
│     ├─ winChecker.checkWin(board, x, y, currentPlayer)      │
│     ├─ ruleEngine checks for 5-in-a-row                     │
│     └─ If win detected: game.winner = currentPlayer         │
│                                                               │
│  5. Update Game in database                                 │
│     ├─ game.currentPlayer = 3 - currentPlayer (toggle)      │
│     ├─ game.board = updated board                           │
│     ├─ game.updatedAt = now                                 │
│     └─ Save to MongoDB                                       │
│                                                               │
│  6. Broadcast to room                                       │
│     ├─ Emit 'move-made' {x, y, board, currentPlayer}        │
│     ├─ If game won: Emit 'game-finished' {winner, status}   │
│     └─ If board full: Emit 'game-finished' {winner: 'draw'} │
└──────┬────────────────────────────────────────────────────────┘
       │ WebSocket Response
       ↓
┌──────────────────────────────────────────────────────────────┐
│  Frontend: Receive 'move-made' event                         │
├──────────────────────────────────────────────────────────────┤
│  GameContext dispatch: {type: 'UPDATE_BOARD', payload}       │
│    ├─ Update board state                                    │
│    ├─ Update currentPlayer                                  │
│    ├─ Re-render board                                       │
│    └─ Clear optimistic flag                                 │
│                                                               │
│  If 'game-finished' received:                                │
│    ├─ Fetch final game state                                │
│    ├─ Save to GameHistory                                   │
│    ├─ Update stats (leaderboard)                            │
│    └─ Display result modal                                  │
└──────────────────────────────────────────────────────────────┘
```

## WebSocket Event Architecture

### Room Management

```
Player1                          Backend                    Player2
  │                                │                           │
  │─ join-room {roomId} ─→         │                           │
  │                         [socket.join(roomId)]              │
  │                                │                           │
  │                    (listening on room)                     │
  │                                │ ←─ join-room {roomId} ─────│
  │                         [socket.join(roomId)]              │
  │ ←─ player-joined ─────────────│                           │
  │                                │─ player-joined ──────────→│
  │                                │                           │
```

### Real-time Move Synchronization

```
  Client 1 (Player1)             Server              Client 2 (Player2)
        │                           │                           │
        │ make-move {x:7, y:5}      │                           │
        │──────────────────────────→│                           │
        │                      validate                         │
        │                     update DB                         │
        │                           │                           │
        │ move-made event           │ move-made event           │
        │←──────────────────────────│──────────────────────────→│
        │  board, currentPlayer     │  board, currentPlayer     │
        │                           │                           │
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│  User (Players)                                             │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId (primary key)                                │
│  username: String (unique)                                  │
│  email: String (unique)                                     │
│  password: String (hashed)                                  │
│  createdAt: Date                                            │
│  lastLogin: Date                                            │
│                                                              │
│  ↓ (references)                                             │
│  │                                                          │
│  ├─→ Game.player1 / Game.player2                           │
│  ├─→ GameHistory.player1 / GameHistory.player2             │
│  └─→ GameStats.userId                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Game (Active Games)                                        │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                              │
│  roomId: String (unique, UUID)                              │
│  roomCode: String (unique, 6-char)                          │
│  gameType: String (default: 'caro')                         │
│  player1: ObjectId → User._id                               │
│  player2: ObjectId → User._id (nullable)                    │
│  player1GuestId: String (for guests)                        │
│  player2GuestId: String (for guests)                        │
│  boardSize: Number (15, 19, 20)                             │
│  board: Number[][] (2D array, 0/1/2)                        │
│  currentPlayer: 1 | 2                                       │
│  gameStatus: 'waiting' | 'playing' | 'finished' | 'abandoned'│
│  winner: 1 | 2 | null | 'draw'                              │
│  winningLine: Array<{row, col}> (optional)                  │
│  rules: {blockTwoEnds, allowUndo, maxUndo, timeLimit}       │
│  score: {player1: Number, player2: Number}                  │
│  moves: [ObjectId] → GameMove._id (virtual relation)        │
│  createdAt: Date                                            │
│  updatedAt: Date                                            │
│  finishedAt: Date (nullable)                                │
│                                                              │
│  ↓ (migration on finish)                                    │
│  │                                                          │
│  └─→ GameHistory (archived when game finishes)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GameHistory (Archived Games)                               │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                              │
│  originalGameId: String (reference to original Game._id)    │
│  roomId: String                                             │
│  roomCode: String                                           │
│  gameType: String                                           │
│  player1: ObjectId → User._id (nullable)                    │
│  player2: ObjectId → User._id (nullable)                    │
│  player1GuestId: String                                     │
│  player2GuestId: String                                     │
│  boardSize: Number                                          │
│  board: Number[][] (final board state)                      │
│  winner: 1 | 2 | null | 'draw'                              │
│  score: {player1, player2}                                  │
│  rules: {...}                                               │
│  finishedAt: Date                                           │
│  createdAt: Date (original game creation)                   │
│  savedAt: Date (archive timestamp)                          │
│                                                              │
│  Indexes: compound on (player1, finishedAt),                │
│           (player2, finishedAt), etc.                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GameStats (Player Statistics)                              │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                              │
│  userId: ObjectId → User._id                                │
│  gameType: String ('caro', etc.)                            │
│  totalGames: Number                                         │
│  wins: Number                                               │
│  losses: Number                                             │
│  draws: Number                                              │
│  totalScore: Number (ELO or point-based)                    │
│  lastPlayedAt: Date                                         │
│  updatedAt: Date                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Leaderboard (Cached Rankings - Optional)                   │
├─────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                              │
│  userId: ObjectId → User._id                                │
│  username: String                                           │
│  totalScore: Number (cached for fast ranking)               │
│  rank: Number (computed)                                    │
│  updatedAt: Date                                            │
│                                                              │
│  Note: Can be regenerated from GameStats if no cache needed │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Game Completion

```
                     Game Finished Event
                              │
                    ┌─────────▼──────────┐
                    │   Backend Handler  │
                    └──────┬─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌────────┐        ┌──────────┐      ┌──────────┐
   │ Save to│        │Update    │      │ Broadcast│
   │Game    │        │GameStats │      │ Result   │
   │History │        │ (Mongo)  │      │(WebSocket)
   └────┬───┘        └────┬─────┘      └────┬─────┘
        │                 │                 │
        │                 │                 │
        ▼                 ▼                 ▼
   ┌──────────┐    ┌─────────────┐    ┌──────────┐
   │Archive in│    │ - wins++    │    │ Frontend:│
   │GameHistory   │ - losses++   │    │ Show     │
   │(permanent)   │ - score+=    │    │ Result   │
   │          │    │ - updated   │    │ Modal    │
   └──────────┘    └─────────────┘    └──────────┘
```

## Performance Optimizations & Indexing

### Database Indexes
```javascript
// User collection
db.users.createIndex({ username: 1 })        // Fast username lookup
db.users.createIndex({ email: 1 })           // Fast email lookup

// Game collection
db.games.createIndex({ roomId: 1 })          // Room lookup
db.games.createIndex({ roomCode: 1 })        // Room code lookup
db.games.createIndex({ gameStatus: 1 })      // Filter waiting/playing

// GameHistory collection (compound indexes for efficiency)
db.gamehistory.createIndex({ player1: 1, finishedAt: -1 })  // User's games
db.gamehistory.createIndex({ player2: 1, finishedAt: -1 })
db.gamehistory.createIndex({ player1GuestId: 1, finishedAt: -1 })
db.gamehistory.createIndex({ player2GuestId: 1, finishedAt: -1 })

// GameStats collection
db.gamestats.createIndex({ userId: 1, gameType: 1 }, { unique: true })
```

### Frontend Optimization
```
1. React.memo() on expensive components (GameBoard, GameCard)
2. useCallback for event handlers
3. lazy loading for pages (React.lazy)
4. Socket.IO event debouncing for rapid moves
5. localStorage caching for JWT + guest history
```

## Scalability Considerations

### Current Monolith
```
Single Express server handles:
  - HTTP REST API
  - WebSocket connections
  - Database operations
  - Business logic
  - File serving (static)
```

### Future Microservices (Optional)
```
Potential decomposition:
  - Auth Service (login/register)
  - Game Service (game logic)
  - Leaderboard Service (rankings)
  - Stats Service (analytics)
  - WebSocket Gateway (Socket.IO coordination)
  - Notification Service (future)
```

### Horizontal Scaling Strategy
```
1. Stateless backend (no session state in memory)
2. Session state → MongoDB (game rooms, moves)
3. WebSocket → Socket.IO Redis adapter (broadcast across servers)
4. Load balancer (nginx) → distribute HTTP & WebSocket
5. Database → MongoDB Atlas (handles replication/sharding)
```

## Error Handling & Recovery

### Network Errors
```
Client disconnects:
  1. Server detects disconnect after 3 second timeout
  2. Mark game as "abandoned" if player doesn't reconnect
  3. Opponent can claim win after 5 minutes timeout
  4. Client attempts reconnect with exponential backoff
  5. If reconnected within timeout: restore game state
```

### Data Consistency
```
Move conflicts:
  1. Server authoritative - all moves validated on backend
  2. Optimistic UI updates on client (assume move valid)
  3. If server rejects: revert board & show error
  4. No local-first edits without server confirmation
```

### Cascading Failures
```
1. Database unavailable:
   - REST API returns 503 Service Unavailable
   - WebSocket closes connection gracefully
   - Clients show "Connection Lost" message
   - Auto-retry when service recovers

2. WebSocket server down:
   - Client reconnect attempts
   - Game state may be lost if not persisted
   - User redirected to home on timeout

3. Partial outage:
   - Some players affected, some not
   - Affected players see error state
   - Stats not updated until service recovers
```

## Security Architecture

### Authentication Layer
```
User credentials → Hash with bcryptjs → Store in DB
                        ↓
            Login validation → JWT generation
                        ↓
            JWT in localStorage (frontend)
                        ↓
            Authorization header on requests
                        ↓
            authMiddleware validates signature
```

### Move Validation (Anti-Cheat)
```
Client sends move → Server receives
                        ↓
           1. Verify player owns session
           2. Verify player's turn
           3. Verify cell empty
           4. Rate limit check (5 moves/sec max)
           5. Block two ends check (if enabled)
           6. Duplicate move check
                        ↓
           If all pass: Update DB + Broadcast
           If any fail: Return error + don't update
```

### Input Sanitization
```
User input (username, email, etc.)
  → Trim whitespace
  → Validate format
  → Check length limits
  → No SQL injection (ORM handles)
  → No XSS (React escapes by default)
```

## Monitoring & Observability

### Key Metrics
```
Backend:
  - API response time (p50, p99)
  - Error rate (4xx, 5xx)
  - Database query time
  - Active WebSocket connections
  - Memory usage
  - CPU usage

Frontend:
  - Page load time (LCP, FCP)
  - JavaScript errors
  - Unhandled promise rejections
  - Network request duration
```

### Logging
```
Backend logs (consider ELK stack):
  - Error logs (errors only)
  - Access logs (API requests)
  - Game events (game start/finish)
  - User actions (auth, moves)

Frontend logs:
  - JavaScript errors (console)
  - Unhandled errors (window.onerror)
  - Network errors (api client)
  - User actions (analytics)
```

## Deployment Architecture

```
Development Environment:
  Frontend: npm start (port 3000)
  Backend: npm run dev (port 5000)
  Database: MongoDB local or Docker

Production Environment:
  Frontend: Vercel CDN (served at edge)
  Backend: Railway/Render (Node.js container)
  Database: MongoDB Atlas (managed cloud)

CI/CD Pipeline:
  Push → GitHub → Test → Build → Deploy Staging → Deploy Production
```

## References

- Socket.IO documentation: https://socket.io/docs/v4/server-api/
- MongoDB schema design: https://www.mongodb.com/docs/manual/core/schema-design-choice/
- React Context API: https://react.dev/reference/react/createContext
- Express best practices: https://expressjs.com/en/advanced/best-practice-performance.html
