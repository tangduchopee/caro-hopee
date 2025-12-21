# Frontend Performance Audit Report
**Date:** 2025-12-21
**Scope:** React rendering, memory leaks, lifecycle correctness, production readiness
**Reviewer:** Code Review Agent
**Build Status:** ✅ Compiled successfully (1 minor warning)

---

## Executive Summary

**Overall Assessment:** GOOD - Production-ready with critical improvements needed

Codebase shows strong understanding of React performance optimization with proper cleanup patterns, memoization, and ref-based optimizations. However, **7 CRITICAL production issues** discovered that will cause failures under real traffic, plus multiple HIGH-priority memory leaks and re-rendering concerns.

**Key Strengths:**
- Excellent RAF/timeout cleanup discipline
- Proper socket listener cleanup with ref-based handlers
- Good use of memo, useMemo, useCallback
- isMounted guards prevent state-after-unmount

**Critical Risks:**
- Context re-render cascade affects entire app on every game state change
- Missing socket cleanup in SocketContext causes connection leaks
- Race conditions in async handlers with stale closures
- Unbounded Set growth in HomePage tracking
- Missing error boundaries - crashes will take down entire app

---

## CRITICAL Issues (Blocking Production)

### C1: Context Re-Render Cascade (GameContext)
**File:** `/frontend/src/contexts/GameContext.tsx:727-768`
**Impact:** Every state change triggers full app re-render

**Problem:**
```tsx
// Lines 727-768: Value changes on EVERY state change
const contextValue = useMemo(() => ({
  game,              // Changes frequently
  players,           // Changes on player join/leave
  currentPlayer,     // Changes every turn
  isMyTurn,          // Changes every turn
  myPlayerNumber,
  roomId,
  pendingUndoMove,
  undoRequestSent,
  lastMove,          // Changes every move
  setGame,           // Stable but included
  joinRoom,          // useCallback - stable
  // ... 8 more functions
}), [
  game,              // ❌ Triggers on every move, status change
  players,           // ❌ Triggers on join/leave
  currentPlayer,     // ❌ Triggers every turn
  // ... all state vars
]);
```

**Why Critical:**
- Under production traffic (60 games/hour, 2 players each = 120 active connections):
  - Every move triggers re-render in GameBoard, GameCell, GameControls, GameInfo, RoomCodeDisplay
  - 15x15 board = 225 GameCell components re-render per move
  - 10-move game = 2,250 unnecessary renders
  - With 60 concurrent games = 135,000 renders/hour

**Evidence:** GameCell has custom memo (line 119) to prevent re-renders, indicating awareness of over-rendering issue.

**Fix Required:**
Split context into separate contexts:
1. `GameStateContext` - rarely changing (game, roomId, myPlayerNumber)
2. `GamePlayContext` - frequently changing (currentPlayer, lastMove, board state)
3. `GameActionsContext` - never changing (all functions)

**Priority:** P0 - Blocks production scale

---

### C2: Socket Connection Leak (SocketContext)
**File:** `/frontend/src/contexts/SocketContext.tsx:55-62`
**Impact:** Multiple socket connections accumulate, exhaust server resources

**Problem:**
```tsx
// Lines 55-62: Cleanup removed all listeners but NOT intentional
return () => {
  if (currentSocket) {
    currentSocket.off('connect', handleConnect);
    currentSocket.off('disconnect', handleDisconnect);
  }
  // Note: We intentionally don't disconnect on unmount to keep connection alive
  // during navigation. Socket cleanup happens on auth change or page unload.
};
```

**Why Critical:**
- Auth changes trigger effect re-run (line 63: `[isAuthenticated]`)
- Old socket listeners removed but socket NOT disconnected
- New socket created (line 32: `socketService.connect()`)
- Result: Multiple active connections per user

**Production Impact:**
- User logs in/out 3 times = 3 active sockets
- 100 users doing this = 300 zombie connections
- Server has max connection limit (typically 10k)
- Causes: timeout errors, message routing to wrong sockets, memory leaks

**Evidence from line 28-34:**
```tsx
const needsReconnect = !socket || !socket.connected || tokenChanged;

if (needsReconnect) {
  socketService.disconnect();  // ✅ Only disconnects BEFORE creating new one
  socketService.connect(token || undefined);
  lastTokenRef.current = token;
}
```

But cleanup doesn't disconnect, so on auth change:
1. Effect re-runs → needsReconnect = true (token changed)
2. Old socket still connected
3. `disconnect()` called but on NEW socket instance (null)
4. New socket created
5. Old socket orphaned

**Fix Required:**
```tsx
return () => {
  // Remove listeners
  if (currentSocket) {
    currentSocket.off('connect', handleConnect);
    currentSocket.off('disconnect', handleDisconnect);
  }

  // ✅ MUST disconnect if auth is changing
  if (lastTokenRef.current !== localStorage.getItem('token')) {
    socketService.disconnect();
  }
};
```

**Priority:** P0 - Resource leak under normal usage

---

### C3: Race Condition in GameContext Socket Handlers
**File:** `/frontend/src/contexts/GameContext.tsx:413-484`
**Impact:** Game results submitted with wrong player data

**Problem:**
```tsx
// Lines 413-484: Timeout captures stale ref values
const handleGameFinished = async (data: { winner: Winner; reason: string }) => {
  // ... extract finishedGameData ...

  const timeoutId = setTimeout(async () => {
    if (!isMounted) return;

    const currentIsAuthenticated = isAuthenticatedRef.current;  // ✅ Uses ref
    const currentUser = userRef.current;                         // ✅ Uses ref
    const currentMyPlayerNumber = myPlayerNumberRef.current;     // ✅ Uses ref
    const currentPlayers = playersRef.current;                   // ✅ Uses ref

    // ❌ But finishedGameData captured from closure 100ms ago
    if (!currentIsAuthenticated && finishedGameData && currentMyPlayerNumber) {
      // Save guest history with potentially stale game state
      saveGuestHistory({
        roomId: finishedGameData.roomId,  // ❌ Might be stale
        // ...
      });
    }
  }, 100);
};
```

**Race Scenario:**
1. Game finishes at T=0
2. `finishedGameData` captured with Player 1 data
3. At T=50ms, user logs in (auth changes)
4. At T=100ms, timeout fires
5. `currentIsAuthenticated` = true (from ref), but `finishedGameData` still has guest data
6. Result: authenticated user submits with wrong player number or guest username

**Production Impact:**
- Guest finishes game → logs in within 100ms → stats saved incorrectly
- Leaderboard corruption
- User sees wrong game history

**Fix Required:**
Move data extraction inside timeout:
```tsx
const timeoutId = setTimeout(async () => {
  if (!isMounted) return;

  // ✅ Re-capture game state inside timeout
  const currentGame = gameRef.current;
  if (!currentGame) return;

  const finishedGameData = {
    roomId: currentGame.roomId,
    // ... use currentGame, not closure
  };

  // ... rest of logic
}, 100);
```

**Priority:** P0 - Data corruption

---

### C4: Stale Closure in HomePage Socket Handlers
**File:** `/frontend/src/pages/HomePage.tsx:254-302`
**Impact:** Socket handlers reference old loadWaitingGames with stale smartMergeGames

**Problem:**
```tsx
// Lines 227-243: loadWaitingGames defined with smartMergeGames dependency
const loadWaitingGames = useCallback(async (silent: boolean = false): Promise<void> => {
  // ...
  setWaitingGames(prev => smartMergeGames(games, prev));
}, [smartMergeGames]);

// Lines 113-164: smartMergeGames uses mountedGamesRef
const smartMergeGames = useCallback((newGames, currentGames) => {
  // ...
  mountedGamesRef.current.add(roomId);  // ✅ Uses ref
  // ...
}, []); // ✅ No dependencies - stable

// Lines 254-302: Socket handlers
useEffect(() => {
  const socket = socketService.getSocket();
  const currentTimeoutRef = updateTimeoutRef.current;  // ❌ Captures timeout ref value

  if (socket) {
    const handleGameCreated = () => {
      loadWaitingGames(true);  // ❌ Closure captures loadWaitingGames from mount
    };

    socket.on('game-created', handleGameCreated);

    return () => {
      if (currentTimeoutRef) {  // ❌ Uses captured value, not current
        clearTimeout(currentTimeoutRef);
      }
      socket.off('game-created', handleGameCreated);
    };
  }
}, [loadWaitingGames]);  // ❌ Effect re-runs if loadWaitingGames changes
```

**Why Critical:**
- `loadWaitingGames` is stable (smartMergeGames has no deps)
- But effect still lists it as dependency
- Not critical NOW but future refactor could add deps to smartMergeGames
- Would cause socket listeners to re-register, accumulate

**Also:**
Line 255: `const currentTimeoutRef = updateTimeoutRef.current;` captures ref VALUE at effect start, but timeout might be set later. Cleanup uses stale value.

**Fix Required:**
```tsx
useEffect(() => {
  // ...
  return () => {
    // ✅ Read ref in cleanup, not at effect start
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    socket.off('game-created', handleGameCreated);
  };
}, []); // ✅ Empty deps - loadWaitingGames is stable via ref pattern
```

Use ref pattern like GameContext (lines 89-104).

**Priority:** P0 - Latent bug, will manifest on refactor

---

### C5: AuthContext Interval Memory Leak
**File:** `/frontend/src/contexts/AuthContext.tsx:38-77`
**Impact:** Interval continues running after user logs out

**Problem:**
```tsx
// Lines 38-77
useEffect(() => {
  // Clear any existing interval
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  // Only set up interval if user is logged in
  if (!user) return;  // ❌ Early return - cleanup won't run

  let isMounted = true;

  const checkTokenValidity = async () => {
    // ...
  };

  intervalRef.current = setInterval(checkTokenValidity, 5 * 60 * 1000);

  return () => {
    isMounted = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [user]);
```

**Race Scenario:**
1. User logged in → interval set (ID=123)
2. User logs out → effect re-runs
3. Line 46: `if (!user) return;` → early return
4. ❌ Cleanup function NOT registered
5. Interval 123 still running
6. Every 5 minutes, fires API call with invalid token

**Production Impact:**
- 100 users log in/out → 100 zombie intervals
- 100 * 12 = 1,200 API calls/hour to /auth/me endpoint
- Server rate limiting triggered
- Unnecessary server load

**Why Not Caught in Testing:**
Interval fires every 5 minutes - QA sessions typically < 5 min.

**Fix Required:**
```tsx
useEffect(() => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  if (!user) return () => {};  // ✅ Return empty cleanup

  let isMounted = true;
  // ... rest of logic
}, [user]);
```

Or restructure:
```tsx
useEffect(() => {
  if (!user) {
    // Clear interval if exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }

  // ... setup logic ...

  return () => { /* cleanup */ };
}, [user]);
```

**Priority:** P0 - Memory leak + unnecessary API traffic

---

### C6: Missing Error Boundaries
**File:** All components
**Impact:** Single error crashes entire app

**Problem:**
No error boundaries found in:
- `/frontend/src/App.tsx`
- `/frontend/src/pages/*`
- `/frontend/src/contexts/*`

**Production Scenarios:**
1. Socket emits malformed `game-finished` event (missing winner field)
2. GameContext line 409: `winner: data.winner` → undefined
3. GameControls line 74: `game.winner === 'draw'` → runtime error
4. React unmounts entire tree → white screen
5. User sees: "Something went wrong" (if lucky) or blank page

**Why Critical:**
Real production events are unpredictable:
- Backend bug sends `winner: null` instead of `winner: 'draw'`
- Network glitch corrupts WebSocket frame
- Browser extension injects bad data

**Fix Required:**
Wrap at multiple levels:

```tsx
// App.tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <SocketProvider>
    <ErrorBoundary fallback={<SocketErrorFallback />}>
      <AuthProvider>
        <GameProvider>
          <ErrorBoundary fallback={<GameErrorFallback />}>
            <Routes />
          </ErrorBoundary>
        </GameProvider>
      </AuthProvider>
    </ErrorBoundary>
  </SocketProvider>
</ErrorBoundary>
```

**Priority:** P0 - Reliability requirement

---

### C7: GameBoard State Update After Unmount (Edge Case)
**File:** `/frontend/src/components/GameBoard/GameBoard.tsx:29-96`
**Impact:** Memory leak warnings in production console

**Problem:**
```tsx
// Lines 29-96
useEffect(() => {
  if (!game) return;

  let isMounted = true;
  let timeoutId: NodeJS.Timeout | null = null;
  let rafId: number | null = null;

  const updateCellSize = (): void => {
    if (!isMounted) return;  // ✅ Guard present
    // ...
    setCellSize(finalSize);  // ❌ But setCellSize might be called after unmount
  };

  const throttledUpdate = (): void => {
    if (!isMounted) return;  // ✅ Guard present

    // ... timeout logic ...
    timeoutId = setTimeout(() => {
      if (!isMounted) return;  // ✅ Guard present
      updateCellSize();  // ✅ Calls function with guard
    }, delay);
  };

  updateCellSize();  // ❌ Initial call - no guard

  const handleResize = (): void => {
    if (!isMounted) return;  // ✅ Guard present
    // ...
  };

  window.addEventListener('resize', handleResize, { passive: true });

  return () => {
    isMounted = false;
    window.removeEventListener('resize', handleResize);
    if (timeoutId) clearTimeout(timeoutId);
    if (rafId) cancelAnimationFrame(rafId);
  };
}, [game?.boardSize]);
```

**Race Scenario:**
1. Effect runs → `updateCellSize()` called immediately (line 76)
2. During `setCellSize()`, game changes (player leaves, game deleted)
3. Component unmounts
4. `setCellSize()` tries to update unmounted component

**Why Rare But Critical:**
- Only happens if game changes during first render
- React 18 StrictMode triggers this more often (double-invoke effects)
- Production console fills with warnings
- Looks unprofessional, indicates memory leak

**Fix Required:**
```tsx
useEffect(() => {
  if (!game) return;

  let isMounted = true;
  // ...

  // ✅ Wrap initial call in RAF
  const initialRafId = requestAnimationFrame(() => {
    if (isMounted) updateCellSize();
  });

  // ...

  return () => {
    isMounted = false;
    if (initialRafId) cancelAnimationFrame(initialRafId);
    // ... rest
  };
}, [game?.boardSize]);
```

**Priority:** P0 - React 18 compatibility, production console noise

---

## HIGH Priority Issues (Edge Cases, Leaks)

### H1: GameContext Timeout Array Growth (Memory Leak)
**File:** `/frontend/src/contexts/GameContext.tsx:107, 484`
**Impact:** Unbounded array growth if user stays in game for hours

**Problem:**
```tsx
// Line 107
const pendingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

// Line 484: Timeout added to array
const timeoutId = setTimeout(async () => { /* ... */ }, 100);
pendingTimeoutsRef.current.push(timeoutId);

// Cleanup (lines 557-559):
pendingTimeoutsRef.current.forEach(clearTimeout);
pendingTimeoutsRef.current = [];
```

**Issue:**
Array only cleared on effect cleanup (component unmount or socket reconnect). During normal gameplay:
- 100 moves = 100 timeouts in array
- Each timeout fires and completes, but ID remains in array
- Array grows unbounded during session

**Production Scenario:**
- Marathon game session: 500 moves over 2 hours
- Array holds 500 timeout IDs (500 * 8 bytes = 4KB)
- Multiply by 100 concurrent users = 400KB
- Not catastrophic but sloppy

**Fix Required:**
```tsx
const timeoutId = setTimeout(async () => {
  // ... game finished logic ...

  // ✅ Remove self from array after execution
  const index = pendingTimeoutsRef.current.indexOf(timeoutId);
  if (index > -1) {
    pendingTimeoutsRef.current.splice(index, 1);
  }
}, 100);
```

**Priority:** P1 - Memory leak (minor), code quality

---

### H2: HomePage mountedGamesRef Unbounded Growth (Fixed But Incomplete)
**File:** `/frontend/src/pages/HomePage.tsx:98-110, 187-198`
**Impact:** Set grows if cleanup fails

**Current Code:**
```tsx
// Lines 102-110: Cleanup added (good!)
useEffect(() => {
  const currentGameIds = new Set(waitingGames.map(g => g.roomId));
  mountedGamesRef.current.forEach(roomId => {
    if (!currentGameIds.has(roomId)) {
      mountedGamesRef.current.delete(roomId);
    }
  });
}, [waitingGames]);

// Lines 149-153: Also cleaned in smartMergeGames
newRoomIds.forEach(roomId => {
  if (!currentRoomIds.has(roomId)) {
    mountedGamesRef.current.delete(roomId);
  }
});
```

**Remaining Issue:**
- Cleanup depends on `waitingGames` state
- If socket disconnect happens, `waitingGames` might not update
- Games deleted on server don't trigger cleanup
- Set grows with "ghost" entries

**Production Scenario:**
1. User loads page → 10 games in list → Set size = 10
2. Socket disconnects (network glitch)
3. During disconnect, 5 games finish
4. Socket reconnects
5. New list has 5 games, but Set still has 10 entries
6. 5 stale entries remain forever

**Over 24 hours:**
- 1,000 games created/finished
- Set size = 1,000 entries
- Each entry = 36 bytes (roomId string) = 36KB
- Multiplied by 100 users = 3.6MB leak

**Fix Required:**
Add periodic cleanup or size limit:
```tsx
useEffect(() => {
  const currentGameIds = new Set(waitingGames.map(g => g.roomId));
  mountedGamesRef.current.forEach(roomId => {
    if (!currentGameIds.has(roomId)) {
      mountedGamesRef.current.delete(roomId);
    }
  });

  // ✅ Safety limit
  if (mountedGamesRef.current.size > 100) {
    console.warn('mountedGamesRef exceeded 100 entries, clearing');
    mountedGamesRef.current.clear();
  }
}, [waitingGames]);
```

**Priority:** P1 - Memory leak (minor), edge case

---

### H3: GameRoomPage Navigation Blocker Race Condition
**File:** `/frontend/src/pages/GameRoomPage.tsx:28-42, 83-93`
**Impact:** User might bypass leave confirmation

**Problem:**
```tsx
// Lines 28-34: Blocker setup
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    game !== null &&
    !hasLeftRef.current &&
    currentLocation.pathname !== nextLocation.pathname
);

// Lines 83-93: Confirm handler
const handleLeaveConfirm = async (): Promise<void> => {
  setShowLeaveConfirm(false);
  try {
    setIsLeaving(true);
    await handleLeaveGame();  // Sets hasLeftRef.current = true (line 71)
  } finally {
    setIsLeaving(false);
  }
};
```

**Race Scenario:**
1. User navigates away → blocker activates → modal shown
2. User clicks "Leave" → `handleLeaveConfirm` called
3. Line 84: Modal closes (state update)
4. Line 87: `handleLeaveGame()` starts (async)
5. User presses browser back button AGAIN before API completes
6. `hasLeftRef.current` still false (line 71 not reached)
7. Blocker activates AGAIN → second modal shown

**Why Critical:**
- Confuses user (two modals?)
- If first API call succeeds but second blocks, game state inconsistent
- User thinks they left but backend still tracking them

**Fix Required:**
Set flag BEFORE async operation:
```tsx
const handleLeaveConfirm = async (): Promise<void> => {
  setShowLeaveConfirm(false);
  hasLeftRef.current = true;  // ✅ Set immediately

  try {
    setIsLeaving(true);
    await handleLeaveGame();
  } finally {
    setIsLeaving(false);
  }
};
```

Move flag setting from `handleLeaveGame` (line 71) to caller.

**Priority:** P1 - Edge case, UX issue

---

### H4: GameControls Move Counting Performance
**File:** `/frontend/src/components/GameControls/GameControls.tsx:85-110`
**Impact:** O(n²) computation on every render

**Problem:**
```tsx
// Lines 85-96: Nested loops, called in render
const getMoveCount = (): number => {
  let moveCount = 0;
  for (let i = 0; i < game.board.length; i++) {
    for (let j = 0; j < game.board[i].length; j++) {
      if (game.board[i][j] !== 0) {
        moveCount++;
      }
    }
  }
  return moveCount;
};

// Lines 98-110: Same pattern
const getMyMoveCount = (): number => { /* ... */ };

// Line 124: Called in render path
const canRequestUndo = (): boolean => {
  if (!myPlayerNumber) return false;
  const myMoveCount = getMyMoveCount();  // ❌ O(n²) every render
  return myMoveCount >= 1;
};
```

**Why Critical:**
- 20x20 board = 400 iterations per call
- `canRequestUndo` called on every render (line 149)
- GameControls re-renders on every game state change (no memo)
- 100 moves × 400 iterations = 40,000 loop iterations per game

**Production Impact:**
- 15x15 board (225 cells) acceptable
- 20x20 board (400 cells) starts lagging
- If future adds 25x25 (625 cells) → noticeable jank

**Fix Required:**
```tsx
// ✅ Memoize results
const moveCount = useMemo(() => {
  let count = 0;
  for (let i = 0; i < game.board.length; i++) {
    for (let j = 0; j < game.board[i].length; j++) {
      if (game.board[i][j] !== 0) count++;
    }
  }
  return count;
}, [game.board]);

const myMoveCount = useMemo(() => {
  if (!myPlayerNumber) return 0;
  let count = 0;
  for (let i = 0; i < game.board.length; i++) {
    for (let j = 0; j < game.board[i].length; j++) {
      if (game.board[i][j] === myPlayerNumber) count++;
    }
  }
  return count;
}, [game.board, myPlayerNumber]);

const canRequestUndo = useCallback((): boolean => {
  return myMoveCount >= 1;
}, [myMoveCount]);
```

**Priority:** P1 - Performance degradation at scale

---

### H5: GameBoard Dependency Array Incomplete
**File:** `/frontend/src/components/GameBoard/GameBoard.tsx:95-96`
**Impact:** Effect doesn't re-run when game changes, potential stale cellSize

**Problem:**
```tsx
// Line 95-96
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [game?.boardSize]);
```

**What's Missing:**
Effect sets up resize listener that calls `updateCellSize()` which uses:
- `containerRef.current` ✅ (ref, doesn't need dep)
- `game` ❌ (used in line 40)
- `setCellSize` ✅ (setState, stable)

**Race Scenario:**
1. Component mounts with game A (15x15)
2. Effect runs, sets cellSize
3. Game changes to game B (20x20) but boardSize stays 15
4. Effect doesn't re-run (boardSize unchanged)
5. Line 40: `updateCellSize` still references game A
6. Cell size calculated wrong

**Why Rare:**
Only if game changes but boardSize stays same. Unlikely in production.

**Fix Required:**
```tsx
}, [game?.boardSize, game?.roomId]); // ✅ Add unique identifier
```

Or better, remove eslint-disable and fix:
```tsx
}, [game]); // ✅ Full game dependency
```

Then wrap handlers in useCallback to prevent listener re-registration.

**Priority:** P1 - Edge case, incorrect layout

---

## MEDIUM Priority Issues (Scale, Maintainability)

### M1: Missing Memo on GameControls
**File:** `/frontend/src/components/GameControls/GameControls.tsx`
**Impact:** Re-renders on every game state change

GameControls not memoized but receives entire game context. Every move triggers re-render even if controls don't change (e.g., game playing, no pending undo).

**Fix:** `export default memo(GameControls);`

---

### M2: HomePage Interval Polling While Socket Active
**File:** `/frontend/src/pages/HomePage.tsx:247-250`
**Impact:** Unnecessary API traffic

```tsx
// Line 250: Fallback interval even when socket working
const interval = setInterval(() => loadWaitingGames(true), 30000);
```

Socket already handles real-time updates. Polling redundant when socket connected.

**Fix:** Only poll if socket disconnected.

---

### M3: GameContext setPlayers Optimization Complexity
**File:** `/frontend/src/contexts/GameContext.tsx:116-172`
**Impact:** Complex logic, hard to maintain

Lines 116-172: Nested conditions to avoid overwriting socket updates. Works but fragile.

**Better Pattern:** Separate "initial load" vs "socket update" into different state setters.

---

### M4: Snackbar onClose No-Op
**File:** `/frontend/src/components/GameControls/GameControls.tsx:210`
**Impact:** Minor UX issue

```tsx
// Line 210
onClose={() => {}}
```

User can't dismiss snackbar manually. Should either allow close or remove close button.

---

### M5: Missing Cleanup in GameRoomPage beforeunload
**File:** `/frontend/src/pages/GameRoomPage.tsx:61-65`
**Impact:** Event listener not cleaned up on early unmount

```tsx
return () => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
};
```

If `game` becomes null, effect re-runs but old listener not removed.

**Fix:** Move addEventListener outside game check.

---

### M6: AuthContext refreshUser Error Handling
**File:** `/frontend/src/contexts/AuthContext.tsx:22-32`
**Impact:** Silent failure on token refresh

```tsx
// Line 25-28
refreshUser().catch(() => {
  localStorage.removeItem('token');
  setIsLoading(false);
});
```

Error swallowed. User not notified. Should show "Session expired" message.

---

### M7: SocketContext Double Disconnect Attempt
**File:** `/frontend/src/contexts/SocketContext.tsx:19-34`
**Impact:** Redundant operations

```tsx
// Lines 31-32
if (needsReconnect) {
  socketService.disconnect();  // Disconnect here
  socketService.connect(token || undefined);
  lastTokenRef.current = token;
}
```

If socket already disconnected, `disconnect()` is no-op but still called.

**Optimization:** Check `socket?.connected` before disconnect.

---

### M8: GameCell Memo Comparison Incomplete
**File:** `/frontend/src/components/GameBoard/GameCell.tsx:119-130`
**Impact:** Might re-render unnecessarily

```tsx
// Line 128: onClick not compared
// onClick is stable via useCallback so we don't compare it
```

Comment says stable but no verification. If parent accidentally creates new function, GameCell re-renders all 225 cells.

**Fix:** Add onClick comparison or verify with React DevTools.

---

## LOW Priority Issues (Nice to Have)

### L1: Console Logging in Production
**Files:** Multiple
Removed most logging but some remain:
- `logger.log()` calls throughout (should use logger.debug in production)
- Consider environment-based logging levels

---

### L2: Magic Numbers
- Line 250: `30000` (30s polling) - use constant
- Line 68: `5 * 60 * 1000` (5 min interval) - use constant
- Line 413: `100` (timeout delay) - use constant

---

### L3: Type Safety in Socket Events
Socket events use `any` in some handlers (line 296, 258). Use typed events from socket.types.ts.

---

### L4: Unused Import Warning
**File:** `/frontend/src/contexts/GameContext.tsx:9`
Build warning: `'Socket' is defined but never used`

Remove or add `// @ts-ignore` if needed for types.

---

### L5: Alert Usage
Files use browser `alert()` for errors (GameContext:529, HomePage:187). Replace with toast/snackbar for better UX.

---

## Positive Observations

### Excellent Practices

1. **RAF Cleanup Discipline** (GameBoard:86-93, GameContext:159-180)
   - Proper cancellation on unmount
   - Ref tracking prevents double-cancellation
   - Best practice for animation work

2. **Socket Listener Pattern** (GameContext:187-576)
   - Refs for latest values prevent listener re-registration
   - Single registration on mount with empty deps
   - Comprehensive cleanup
   - Comments explain reasoning

3. **isMounted Guards** (GameBoard:32, GameContext:192)
   - Prevents state-after-unmount warnings
   - Production-quality React pattern

4. **Memoization Awareness**
   - GameCell custom memo (line 119)
   - winningCellsSet useMemo (GameBoard:13-18)
   - handleCellClick useCallback (GameBoard:20-26)

5. **Proper Passive Listeners** (GameBoard:87)
   ```tsx
   window.addEventListener('resize', handleResize, { passive: true });
   ```
   Improves scroll performance.

6. **Navigation Blocker** (GameRoomPage:28-42)
   - Prevents accidental game abandonment
   - Good UX for active games

7. **Throttling** (GameBoard:36-74)
   - 100ms throttle on resize
   - Prevents performance issues on window drag

8. **Build Output Clean**
   - Only 1 minor warning (unused import)
   - Successful production build
   - Reasonable bundle size (227KB gzipped)

---

## Recommended Actions (Prioritized)

### Immediate (P0 - Before Production)

1. **Split GameContext** → C1
   - 2-3 hours work
   - Massive performance gain
   - Required for scale

2. **Fix Socket Connection Leak** → C2
   - 30 minutes
   - Critical resource leak

3. **Add Error Boundaries** → C6
   - 1 hour
   - Production reliability requirement

4. **Fix AuthContext Interval Leak** → C5
   - 15 minutes
   - Easy fix, high impact

5. **Fix GameContext Race Condition** → C3
   - 1 hour
   - Data corruption risk

### Next Sprint (P1)

6. **Fix HomePage Socket Handler** → C4
7. **Fix GameBoard Unmount Race** → C7
8. **Add Timeout Cleanup** → H1
9. **Fix Navigation Blocker Race** → H3
10. **Memoize GameControls Move Counting** → H4

### Backlog (P2)

11. Medium issues (M1-M8)
12. Low issues (L1-L5)

---

## Test Recommendations

### Load Testing
- 100 concurrent games (200 WebSocket connections)
- Monitor:
  - Socket connection count
  - Memory usage over time
  - Re-render count (React DevTools Profiler)
  - Network traffic

### Stress Testing
- Rapid game creation/deletion
- User login/logout cycles
- Network disconnect/reconnect
- Tab close/reopen

### Memory Profiling
- Chrome DevTools → Memory → Take heap snapshot
- Play 50 games
- Take another snapshot
- Compare → should see minimal growth

### Error Injection
- Test error boundaries with malformed socket events
- Simulate API failures
- Test concurrent navigation during game end

---

## Metrics Summary

**Lines Analyzed:** ~3,500
**Files Reviewed:** 7 core files
**Critical Issues:** 7
**High Priority:** 5
**Medium Priority:** 8
**Low Priority:** 5
**Total Issues:** 25

**Code Quality Score:** 7.5/10
- Strong fundamentals (-0.5)
- Context re-render issue (-1)
- Missing error boundaries (-0.5)
- Memory leaks (-0.5)

**Production Readiness:** 6/10
- Critical fixes required before launch
- Good foundation, needs refinement
- Strong cleanup patterns already in place

---

## Conclusion

Codebase demonstrates strong React knowledge with proper cleanup patterns, memoization, and ref usage. However, **7 critical issues block production deployment**, primarily around context re-rendering, socket connection management, and error handling.

**Primary Risks:**
1. Performance collapse under scale (context cascade)
2. Resource exhaustion (socket leaks, interval leaks)
3. Data corruption (race conditions in game finish handler)
4. Poor reliability (no error boundaries)

**Estimated Fix Time:** 8-12 hours for all P0 issues

**Recommendation:** Address P0 issues before production launch. P1 issues can be tackled in first post-launch sprint. Code quality is high - with fixes, this will be production-grade.

---

**Reviewer Notes:**
- Team shows strong understanding of React performance
- Cleanup discipline is excellent (RAF, timeouts, listeners)
- Context optimization knowledge gap (common issue)
- Ready for production with critical fixes
- Consider code review training on context optimization patterns

