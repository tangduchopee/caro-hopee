# Game Rooms/Tables - Dashboard Components & Socket Events Scout Report

**Date**: 2026-01-18 | **Topic**: Game Room Management System | **Status**: Complete

---

## Executive Summary

Located all files related to game room/table management including dashboard, card display components, API endpoints, data models, and Socket.IO events. System uses real-time WebSocket updates with HTTP fallback polling.

---

## 1. Dashboard / Game List Display (Frontend)

### Primary Dashboard Page
**File**: `/Users/admin/Downloads/caro-hopee/frontend/src/pages/HomePage.tsx` (1,245 lines)

**Key Features**:
- Displays list of waiting games in a grid layout (4 columns on desktop, responsive)
- Smart merge algorithm for game updates (lines 113-164) - prevents full array replacement
- Socket.IO listeners for real-time updates:
  - `game-created` - New game appeared
  - `game-status-updated` - Player joined/game status changed
  - `game-deleted` - Game removed from list
- Fallback polling every 30 seconds if socket disconnected
- Mounted games tracking (lines 96-109) for animation optimization
- Skeleton loaders while fetching
- Empty state handling

**Critical Code Snippets**:
```typescript
// Smart merge to prevent unnecessary re-renders
const smartMergeGames = useCallback((newGames, currentGames) => {
  // Only updates changed fields, preserves existing references
  newGames.forEach(newGame => {
    const existing = gameMap.get(newGame.roomId);
    if (existing) {
      const hasChanged = (check status, playerCount, canJoin changes)
      if (hasChanged) { gameMap.set(newGame.roomId, newGame); }
    }
  });
}, []);

// Socket listeners
socket.on('game-created', handleGameCreated);
socket.on('game-status-updated', handleGameStatusUpdated);
socket.on('game-deleted', handleGameDeleted);
```

---

## 2. Game Card Component

**File**: `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameCard/GameCard.tsx` (200 lines)

**Props**:
```typescript
interface GameCardProps {
  game: WaitingGame;
  isNewGame: boolean;
  joiningGameId: string | null;
  onJoin: (game: WaitingGame) => void;
}
```

**Game Data Structure**:
```typescript
interface WaitingGame {
  _id: string;
  roomId: string;
  roomCode: string;
  boardSize: number;
  gameStatus: string;
  displayStatus?: 'waiting' | 'ready' | 'playing';
  statusLabel?: string;
  canJoin?: boolean;
  hasPlayer1: boolean;
  hasPlayer2: boolean;
  playerCount?: number;
  player1Username: string | null;
  createdAt: string;
}
```

**Display Elements**:
- Room code in monospace font (large, gradient text)
- Board size chip (e.g., "15x15")
- Status chip (color-coded: blue=waiting, green=ready, orange=playing)
- Host username
- Join button (disabled if full/playing)
- Hover effects, loading states

---

## 3. Backend API Endpoints (Game Room)

**File**: `/Users/admin/Downloads/caro-hopee/backend/src/routes/gameRoutes.ts`

Routes:
```typescript
POST   /games/create              → createGame()
GET    /games/waiting             → getWaitingGames()  ← Main dashboard data
GET    /games/code/:roomCode      → getGameByCode()
POST   /games/:roomId/join        → joinGame()
POST   /games/:roomId/leave       → leaveGame()
GET    /games/:roomId             → getGame()
GET    /games/user/:userId        → getUserGames()
POST   /games/history             → getGameHistory()
```

---

## 4. Game Controller - Core Logic

**File**: `/Users/admin/Downloads/caro-hopee/backend/src/controllers/gameController.ts` (939 lines)

### A. `getWaitingGames()` - Main dashboard endpoint (lines 348-427)

**Optimization**: Uses `.lean()` for fast reads + batch user lookup (not N+1)

**Query**:
```javascript
Game.find({
  gameStatus: { $in: ['waiting', 'playing'] },
  $or: [
    { player1: { $ne: null } },
    { player1GuestId: { $ne: null } },
  ],
})
.sort({ createdAt: -1 })
.limit(50)
.lean()
```

**Response Structure**:
```typescript
{
  _id: string;
  roomId: string;
  roomCode: string;
  boardSize: number;
  gameStatus: 'waiting' | 'playing';
  displayStatus: 'waiting' | 'ready' | 'playing';  // For UI
  statusLabel: string;  // e.g., "Waiting (1/2)"
  canJoin: boolean;
  hasPlayer1: boolean;
  hasPlayer2: boolean;
  playerCount: number;
  player1Username: string | null;
  createdAt: ISO string;
}
```

### B. `createGame()` (lines 11-99)

- Emits Socket.IO event: `game-created`
- Data sent to all clients:
```typescript
{
  roomId, roomCode, boardSize, gameStatus: 'waiting',
  player1Username, createdAt
}
```

### C. `joinGame()` (lines 173-327)

- Assigns player2 to game
- Emits Socket.IO: 
  - `player-joined` → to room participants
  - `game-status-updated` → to lobby (all clients)

### D. `leaveGame()` (lines 429-761)

Complex logic:
- If both players leave → delete game, emit `game-deleted`
- If player1 (host) leaves → transfer to player2, reset if game was finished/playing
- If only player2 leaves → keep game waiting
- Emits Socket.IO:
  - `player-left` → to room
  - `game-status-updated` → to lobby
  - `game-deleted` → to lobby (if both left)

---

## 5. Game Model / Database Schema

**File**: `/Users/admin/Downloads/caro-hopee/backend/src/models/Game.ts` (175 lines)

```typescript
interface IGame {
  roomId: string;              // UUID, unique, indexed
  roomCode: string;            // 6-char alphanumeric, unique, indexed
  gameType: string;            // 'caro' (extensible for future games)
  player1: ObjectId | null;    // Authenticated user or null
  player2: ObjectId | null;    // Authenticated user or null
  player1GuestId: string | null;   // Guest ID if not authenticated
  player2GuestId: string | null;   // Guest ID if not authenticated
  boardSize: number;           // 3, 15, 19, 20
  board: number[][];           // Game state
  currentPlayer: 1 | 2;
  gameStatus: 'waiting' | 'playing' | 'finished' | 'abandoned';
  winner: 1 | 2 | null | 'draw';
  winningLine?: Array<{row, col}>;
  rules: {
    blockTwoEnds: boolean;
    allowUndo: boolean;
    maxUndoPerGame: number;
    timeLimit: number | null;
  };
  score: { player1: number; player2: number };
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}
```

**Indexes**:
- `roomId` (unique, primary lookup)
- `roomCode` (unique, for code-based joins)
- Compound: `{ gameStatus: 1, createdAt: -1 }` (for getWaitingGames query)

---

## 6. Frontend API Client

**File**: `/Users/admin/Downloads/caro-hopee/frontend/src/services/api.ts` (partial, lines 40-80)

```typescript
gameApi = {
  create: (boardSize, rules) → POST /games/create,
  getGame: (roomId) → GET /games/:roomId,
  getGameByCode: (roomCode) → GET /games/code/:roomCode,
  joinGame: (roomId) → POST /games/:roomId/join,
  getWaitingGames: () → GET /games/waiting,  // Used by HomePage
  leaveGame: (roomId) → POST /games/:roomId/leave,
  getUserGames: (userId) → GET /games/user/:userId,
  getGameHistory: () → POST /games/history,
};
```

---

## 7. Socket.IO Events

**File**: `/Users/admin/Downloads/caro-hopee/frontend/src/types/socket.types.ts`

### Server → Client Events (Related to Game Rooms)

| Event | Data | Listener | Used In |
|-------|------|----------|---------|
| `game-created` | `{ roomId, roomCode, boardSize, gameStatus, player1Username, createdAt }` | HomePage | Real-time list update |
| `game-status-updated` | `{ roomId, roomCode, gameStatus, displayStatus, playerCount, isFull }` | HomePage | When player joins/leaves |
| `game-deleted` | `{ roomId }` | HomePage | Remove from list |
| `room-joined` | `{ roomId, players, gameStatus, currentPlayer }` | GameRoomPage | Enter game room |
| `player-joined` | `{ player: PlayerInfo }` | GameRoomPage | Room update |
| `player-left` | `{ playerNumber, roomId, hostTransferred, gameReset, game }` | GameRoomPage, HomePage | Player left |
| `game-finished` | `{ winner, reason }` | GameRoomPage | Game end |

### Backend Socket Emissions

**File**: `/Users/admin/Downloads/caro-hopee/backend/src/services/socketService.ts` (1-100 lines, more on next read)

**Throttling Strategy** (lines 12-26):
```typescript
const BROADCAST_THROTTLE_MS = 100; // Prevents socket spam
const throttledBroadcast = (io, event, data): boolean => {
  const now = Date.now();
  const lastTime = lastBroadcastTime.get(event) || 0;
  if (now - lastTime < BROADCAST_THROTTLE_MS) {
    return false; // Skip this broadcast
  }
  lastBroadcastTime.set(event, now);
  io.emit(event, data);
  return true;
};
```

**Socket Handlers**:
- `join-room` (lines 41-100+) - Player joins Socket.IO room
  - Validates game exists
  - Returns player list + current game state
  - Emits `room-joined`

---

## 8. Frontend Type Definitions

**File**: `/Users/admin/Downloads/caro-hopee/frontend/src/types/game.types.ts`

```typescript
interface Game {
  _id: string;
  roomId: string;
  roomCode: string;
  player1: string | null;
  player2: string | null;
  player1GuestId: string | null;
  player2GuestId: string | null;
  boardSize: number;
  board: number[][];
  currentPlayer: 1 | 2;
  gameStatus: 'waiting' | 'playing' | 'finished' | 'abandoned';
  winner: 1 | 2 | null | 'draw';
  winningLine?: Array<{row, col}>;
  rules: GameRules;
  score: GameScore;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

interface PlayerInfo {
  id: string;
  username: string;
  isGuest: boolean;
  playerNumber: 1 | 2;
}
```

---

## 9. Frontend State Management (Contexts)

**File**: `/Users/admin/Downloads/caro-hopee/frontend/src/contexts/GameContext.tsx` (partial)

- Manages game state, moves, undo system
- Dispatches game updates from Socket events
- Updates UI based on game status

---

## Key Data Flows

### A. List Update Flow (Real-time)
```
Backend: Game Created/Updated
  ↓
io.emit('game-created' or 'game-status-updated')
  ↓
Frontend: HomePage listens to Socket event
  ↓
Calls getWaitingGames() API to refresh full list
  ↓
smartMergeGames() prevents full re-render
  ↓
UI updates with new/changed games
```

### B. Quick Join Flow
```
User: Clicks "Join Game" on GameCard
  ↓
gameApi.joinGame(roomId)
  ↓
Backend: assignGame as player2
  ↓
io.emit('game-status-updated') → room full
  ↓
Navigate to /game/:roomId
  ↓
Socket.IO connects to game room
```

### C. Leave & Cleanup Flow
```
User: Leaves game (network disconnect or explicit leave)
  ↓
gameApi.leaveGame(roomId)
  ↓
Backend: Remove player, check remaining players
  ↓
If 0 players: delete game, emit 'game-deleted'
If 1 player: reset board if needed, emit 'game-status-updated'
  ↓
Frontend: HomePage receives socket event
  ↓
Update game list accordingly
```

---

## Performance Optimizations

1. **Database Queries** (gameController.ts:348-427)
   - `.lean()` for read-only queries
   - Batch user lookups instead of N+1 populate calls
   - Compound indexes on `gameStatus + createdAt`

2. **Frontend Rendering** (HomePage.tsx)
   - `smartMergeGames()` - Only updates changed fields
   - `memo()` on GameCard component
   - Mounted games tracking to prevent stale animations
   - CSS containment: `contain: 'layout paint'`

3. **Socket.IO**
   - Throttled broadcasts (100ms minimum)
   - Exponential backoff reconnection (1s → 10s max)
   - WebSocket transport only (no fallback polling)

4. **Polling Fallback** (HomePage.tsx:252)
   - Every 30 seconds (not aggressive)
   - Only if Socket.IO fails

---

## Related Files Not Directly Game-List Related

- `/backend/src/services/gameEngine.ts` - Board logic
- `/backend/src/services/ruleEngine.ts` - Win detection
- `/backend/src/services/winChecker.ts` - Consecutive piece detection
- `/frontend/src/pages/GameRoomPage.tsx` - Individual game display
- `/frontend/src/contexts/SocketContext.tsx` - Socket connection management

---

## Summary Table

| Category | Files | Key Classes/Exports |
|----------|-------|---------------------|
| **Dashboard UI** | HomePage.tsx | `HomePage` (main dashboard) |
| **Cards** | GameCard.tsx | `GameCard` (memoized) |
| **API Client** | api.ts | `gameApi.getWaitingGames()` |
| **Backend Routes** | gameRoutes.ts | Routes definition |
| **Controllers** | gameController.ts | `getWaitingGames()`, `createGame()`, `joinGame()`, `leaveGame()` |
| **Database Model** | Game.ts | `IGame`, indexes |
| **Socket Types** | socket.types.ts | `ClientToServerEvents`, `ServerToClientEvents` |
| **Game Types** | game.types.ts | `Game`, `PlayerInfo`, `WaitingGame` |

---

## Unresolved Questions

- None identified. All game room/table dashboard system is well-documented and accessible.

