# Project Overview & Product Development Requirements (PDR)

## Project Vision
Create a scalable real-time multiplayer game platform with Cờ Caro (Tic-Tac-Toe variant) as the first game, supporting both authenticated and guest players with comprehensive game history and leaderboard systems.

## Functional Requirements

### 1. Authentication & User Management
**FR1.1 - User Registration**
- Users create account with username, email, password
- Unique username & email validation
- Password minimum 6 characters
- Account creation triggers automatic leaderboard entry
- Acceptance Criteria:
  - POST /api/auth/register returns JWT token
  - User stored in MongoDB with hashed password
  - Duplicate prevention (409 Conflict)

**FR1.2 - User Login**
- Login with email/password
- Returns JWT token (7-day expiry)
- Token stored in localStorage (frontend)
- Rate limited to 5 requests/15 min per IP
- Acceptance Criteria:
  - POST /api/auth/login returns valid JWT
  - Token decoded correctly in subsequent requests
  - Token expiry enforced server-side

**FR1.3 - Guest Play**
- Play without registration
- Guest ID generated (UUID)
- Guest game history stored locally (localStorage)
- Guest cannot access leaderboard or stats
- Acceptance Criteria:
  - Guest ID persists across sessions
  - Temporary games playable without auth
  - Guest history survives page refresh

### 2. Game Creation & Room Management
**FR2.1 - Create Game Room**
- Authenticated or guest user creates new game
- Auto-generate 6-character alphanumeric room code
- Select board size (3x3, 15x15, 19x19, 20x20)
- Configure game rules (blockTwoEnds, allowUndo, maxUndo)
- Room enters "waiting" status
- Acceptance Criteria:
  - POST /api/games/create returns roomId & roomCode
  - Room code unique and human-readable
  - Room accessible via code or ID

**FR2.2 - Join Game Room**
- Join via room ID or room code
- Check game status (must be "waiting" or "ready")
- Assign as player2 if player1 exists
- Status transitions: waiting → ready (when 2 players) → playing (when started)
- Acceptance Criteria:
  - POST /api/games/:roomId/join prevents late joins
  - Player2 socket connection established
  - Board sent to both players

**FR2.3 - Room State Visibility**
- Display waiting games in lobby
- Show player count (1/2 or 2/2)
- Show game status (waiting, ready, playing, finished)
- Show game creation time
- Display room code for sharing
- Acceptance Criteria:
  - GET /api/games returns filterable room list
  - Status accurately reflects player count

### 3. Game Mechanics & Rules
**FR3.1 - Board State Management**
- 2D array representation (0 = empty, 1 = player1, 2 = player2)
- Configurable board sizes
- Current player tracking (alternates between 1 & 2)
- Move history with timestamps
- Acceptance Criteria:
  - Board persists through game lifecycle
  - Board sent to clients on join & after moves
  - Invalid moves rejected server-side

**FR3.2 - Move Validation & Placement**
- Only valid empty cells accept moves
- Enforce turn order (alternate between players)
- Anti-cheat: Prevent duplicate moves, rate limit moves
- Server-side validation (authoritative)
- Acceptance Criteria:
  - Invalid moves return 400 error with reason
  - Valid moves broadcast to both players
  - Prevent move out-of-bounds, occupied cell, wrong turn

**FR3.3 - Win Detection (5 in a Row)**
- Check horizontal, vertical, diagonal patterns
- Detect 5+ consecutive pieces (same player)
- Store winning line coordinates
- Declare winner immediately
- Acceptance Criteria:
  - Win detected before next move
  - Winning line highlighted on board
  - Game status changes to "finished"

**FR3.4 - Block Two Ends Rule (Chặn 2 đầu)**
- When enabled: prevent creating pattern with 2 open ends
- Prevent certain tactical advantages
- Togglable per game
- Acceptance Criteria:
  - Invalid moves return error if violate block rule
  - Rule state configurable at game creation
  - Clear error message for blocked moves

**FR3.5 - Draw Detection**
- Detect when board full (no winner possible)
- Declare draw explicitly
- Award tie statistics to both players
- Acceptance Criteria:
  - Game auto-finishes when board full
  - No moves possible on draw
  - Stats updated for both players

### 4. Game Control Features
**FR4.1 - Surrender**
- Player can surrender at any time during game
- Opponent declared winner
- Game ends immediately
- Stats updated (loss for surrenderer, win for opponent)
- Acceptance Criteria:
  - POST event triggers immediate game end
  - Opponent receives surrender notification
  - Leaderboard updated

**FR4.2 - Undo Request System**
- Player requests undo of their last move
- Opponent can approve/reject
- Approved undo reverts board & move history
- Limited to N undos per game (default 3)
- Acceptance Criteria:
  - Undo counter tracked per game
  - Request creates decision prompt for opponent
  - Board rollback works correctly
  - Limit enforced (reject if limit exceeded)

**FR4.3 - Game Leave & Disconnect Handling**
- Player leaves voluntarily or disconnects
- Opponent can continue or claim win
- Game status changes to "abandoned"
- Reconnect within timeout: rejoin game
- Timeout exceeded: opponent declared winner
- Acceptance Criteria:
  - Disconnect detected within 3 seconds
  - Reconnect available for 5 minutes
  - Timeout default enforced

### 5. Game History & Persistence
**FR5.1 - Game Recording**
- Save completed game to database
- Store board state, moves, players, result
- Track game creation & finish time
- Include all game settings (rules, board size)
- Acceptance Criteria:
  - GameHistory record created on finish
  - All game data archived
  - Query by player, opponent, date

**FR5.2 - Game Replay**
- Retrieve past games by user
- Display move sequence with timestamps
- Visualize final board state
- Show game statistics (duration, move count)
- Acceptance Criteria:
  - GET /api/games/user/:userId returns game array
  - Pagination supported (20 per page default)
  - Can fetch by date range

**FR5.3 - Guest History**
- Guest games stored in localStorage
- Persist up to 10 games
- Accessible from "Game History" modal
- No server persistence
- Acceptance Criteria:
  - Guest history survives page refresh
  - Oldest game removed when limit exceeded
  - Local storage quota error handled

### 6. Leaderboard & Statistics
**FR6.1 - Leaderboard System**
- Rank players by total score
- Show top 100 players
- Display username, wins, losses, draws, score
- Update on game completion
- Acceptance Criteria:
  - GET /api/leaderboard returns top 100
  - Scoring: win=+10, loss=-5, draw=+2 (configurable)
  - Rankings updated within 5 seconds of game finish

**FR6.2 - User Statistics**
- Per-user stats: wins, losses, draws, total games, win rate
- Per-game-type stats (for future game variants)
- Win/loss ratio calculation
- Last played timestamp
- Acceptance Criteria:
  - GET /api/users/:userId/stats returns accurate counts
  - Stats updated atomically with game finish
  - Cache stats for performance

**FR6.3 - Player Profile**
- View user profile (username, join date, stats)
- Compare stats (win rate, total games)
- See recent game history
- Acceptance Criteria:
  - GET /api/users/:userId returns profile
  - Public profile accessible
  - Stats correctly aggregated

### 7. Real-time Updates (WebSocket)
**FR7.1 - Socket Connection & Rooms**
- Establish WebSocket connection on app load
- Join specific game room on room entry
- Broadcast moves to room participants
- Leave room on page navigation
- Acceptance Criteria:
  - socket.io connection established
  - Rooms isolated (no crosstalk)
  - Reconnect on temporary disconnection

**FR7.2 - Live Game Updates**
- Move broadcast < 100ms latency
- Player join/leave notifications
- Turn indicator updates
- Real-time score display
- Acceptance Criteria:
  - Both players see same board state
  - Moves appear instantly on opponent screen
  - No race conditions (server authoritative)

**FR7.3 - Connection State Feedback**
- Display connection status (connected/reconnecting/disconnected)
- Auto-reconnect with exponential backoff
- Handle connection timeouts (> 10 seconds)
- Graceful degradation (disable moves when disconnected)
- Acceptance Criteria:
  - UI shows connection indicator
  - Moves blocked if socket disconnected
  - Automatic reconnect attempted

### 8. User Interface & UX
**FR8.1 - Navigation & Routing**
- Home page with game browser
- Login/register pages
- Game room with board & controls
- Leaderboard view
- User profile page
- Responsive design (mobile & desktop)
- Acceptance Criteria:
  - All pages load < 2 seconds
  - Navigation smooth (no layout shift)
  - Mobile layout adjusts (touch-friendly)

**FR8.2 - Game Board Display**
- Interactive grid (selectable cells)
- Pieces rendered clearly (player1 vs player2)
- Winning line highlighted
- Latest move indicator
- Board size responsive
- Acceptance Criteria:
  - Cell click triggers move (if valid)
  - Visual feedback on hover
  - Board 100% playable on mobile

**FR8.3 - Game Controls UI**
- Surrender button (with confirmation)
- Undo request button (disabled when limit reached)
- Room code display + copy button
- Game status/timer display
- Player info cards
- Acceptance Criteria:
  - All buttons accessible (min 44px touch target)
  - Confirmation prevents accidental surrender
  - Copy button shows success feedback

## Non-Functional Requirements

### Performance
**NFR1.1** - Response Time
- API endpoints: < 200ms (p99)
- WebSocket events: < 100ms
- Page loads: < 2s (First Contentful Paint)
- Board render: < 50ms

**NFR1.2** - Concurrency
- Support 1000 concurrent connections
- 100 simultaneous games
- Database handles 10k writes/hour

**NFR1.3** - Scalability
- Horizontal scaling for backend (stateless)
- Vertical scaling for database (MongoDB Atlas)
- CDN for static frontend assets
- Load balancing ready

### Reliability
**NFR2.1** - Availability
- 99.5% uptime SLA
- Auto-recovery from crashes
- Database redundancy (Atlas multi-region)
- Graceful degradation on partial outages

**NFR2.2** - Data Integrity
- ACID transactions for game finish
- Atomic stats updates
- No lost moves (persistent queue if needed)
- Backup retention: 30 days

**NFR2.3** - Consistency
- Server-authoritative game state
- Eventual consistency for leaderboard
- No stale data in client cache

### Security
**NFR3.1** - Authentication
- JWT tokens with 7-day expiry
- Password hashing (bcryptjs, salt rounds ≥ 10)
- HTTPS only (enforce in production)
- Rate limiting on auth endpoints

**NFR3.2** - Authorization
- Users can only access their own data
- Guest users have limited access
- Admin routes protected (future expansion)

**NFR3.3** - Anti-Cheat
- Server-side move validation
- Rate limiting per player (5 moves/second max)
- Duplicate move prevention
- Timezone/latency tolerance

**NFR3.4** - Data Protection
- Passwords never logged
- PII (email) encryption at rest
- CORS configured for trusted origins
- No sensitive data in JWT payload

### Accessibility
**NFR4.1** - WCAG Compliance
- Color contrast ratio 4.5:1 for text
- Keyboard navigation (tab, enter, arrow keys)
- Screen reader support (aria labels)
- Alt text for images

**NFR4.2** - Mobile
- Touch-friendly interface (44px min buttons)
- Responsive layout (320px minimum width)
- No horizontal scroll at default zoom
- Fast zoom gesture prevention

### Maintainability
**NFR5.1** - Code Quality
- TypeScript strict mode enabled
- ESLint configured
- Code comments for complex logic
- DRY principles followed

**NFR5.2** - Documentation
- README with setup instructions
- API documentation (endpoint specs)
- Architecture documentation
- Game rules documentation

**NFR5.3** - Testing
- Unit tests for services (backend)
- Integration tests for APIs
- E2E tests for user flows
- Minimum 70% code coverage (goal)

## Acceptance Criteria Summary

**By MVP (Minimum Viable Product)**
- [ ] User can register/login (FR1.1, FR1.2)
- [ ] User can create & join game rooms (FR2.1, FR2.2)
- [ ] Play 15x15 Caro on shared board (FR3.1, FR3.2, FR3.3)
- [ ] Win detection works (5 in a row)
- [ ] Surrender feature works (FR4.1)
- [ ] Real-time moves via WebSocket (FR7.1, FR7.2)
- [ ] Leaderboard displays top 100 (FR6.1)
- [ ] Mobile responsive (FR8.1)

**Post-MVP Enhancements**
- [ ] Block Two Ends rule (FR3.4)
- [ ] Undo system (FR4.2)
- [ ] Game replay (FR5.2)
- [ ] Multiple board sizes (FR3.1)
- [ ] Guest play (FR1.3)
- [ ] User profiles (FR6.3)

## Success Metrics

1. **User Engagement**
   - Target: 100 daily active users (DAU)
   - Target: 2+ games per user per day
   - Target: 30% week-over-week growth

2. **Performance**
   - API latency p99 < 200ms
   - WebSocket latency < 100ms
   - Page load < 2s

3. **Reliability**
   - 99.5% uptime
   - < 0.1% error rate on API
   - Zero data loss

4. **Quality**
   - 70%+ test coverage
   - < 5 critical bugs per month
   - WCAG AA accessibility

## Implementation Timeline

### Phase 1: MVP (Weeks 1-4)
- User auth (register/login)
- Game creation & joining
- Basic Caro gameplay
- WebSocket real-time sync
- Leaderboard v1

### Phase 2: Polish (Weeks 5-6)
- Disconnect handling & reconnect
- Game history storage
- UI/UX improvements
- Mobile optimization
- Documentation

### Phase 3: Features (Weeks 7-8)
- Block Two Ends rule
- Undo system
- Guest play
- User profiles
- Game replay

### Phase 4: Scale (Weeks 9+)
- Performance optimization
- Database indexing
- Caching layer
- Multi-game support (templates)
- Tournament system (future)

## Risk Management

### Technical Risks
- **WebSocket Reliability**: Mitigation: Implement heartbeat & reconnect logic
- **Database Scaling**: Mitigation: Use MongoDB Atlas, plan indexes early
- **Client-Server Desync**: Mitigation: Server-authoritative state, validation
- **Cheat Prevention**: Mitigation: Anti-cheat service, rate limiting

### Business Risks
- **User Churn**: Mitigation: Engaging leaderboard, multiplayer incentives
- **Server Costs**: Mitigation: Monitor usage, auto-scale settings
- **Competitive Landscape**: Mitigation: Focus on UX & community

## Glossary

- **Caro/Gomoku**: 5-in-a-row game (Vietnamese: Cờ Caro)
- **Block Two Ends**: Rule preventing certain tactical patterns
- **Room Code**: 6-char shareable game invite identifier
- **Guest ID**: UUID for unauthenticated players
- **ELO**: Rating system (used for leaderboard scoring)
- **Finite State Machine**: Game status transitions (waiting → ready → playing → finished)
- **Server-Authoritative**: Backend validates all moves (source of truth)

## Related Documents

- [README.md](/README.md) - Quick start guide
- [SYSTEM_ARCHITECTURE.md](/SYSTEM_ARCHITECTURE.md) - Technical design
- [GAME_FEATURES_AND_LOGIC.md](/GAME_FEATURES_AND_LOGIC.md) - Detailed game rules
- [docs/codebase-summary.md](/docs/codebase-summary.md) - Codebase overview
- [docs/code-standards.md](/docs/code-standards.md) - Development standards

## Questions & Clarifications

1. **Scoring Formula**: Current MVP uses fixed score (win=+10, loss=-5, draw=+2). Should this be dynamic based on opponent rating?
2. **Undo Limits**: Default 3 undos/game. Should this be configurable per rule set?
3. **Guest Persistence**: Guest history via localStorage. Should cloud backup be added?
4. **Future Games**: GameType template exists but not fully used. Prioritize multi-game support when?
5. **Monetization**: No monetization currently. Plan for premium features?
