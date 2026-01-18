# Frontend Files for i18n Translation - COMPLETE REPORT

Ngày: 2026-01-18  
Scope: Tất cả file frontend chứa text cần dịch sang Tiếng Việt

---

## Tóm tắt Tổng thể

Đã xác định **12 file** chính cần cập nhật:
- **6 Pages** (trang chính)
- **4 Components** (UI components)
- **1 Utilities** (time formatting)
- **1 Constants** (cấu hình - không cần dịch)

**Tổng số strings cần dịch: ~160+**

---

## I. PAGES - 6 FILES (PRIORITY 1-2)

### 1. HomePage.tsx - CRITICAL
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/pages/HomePage.tsx`

**Strings cần dịch (~45):**
```
// Sidebar
"Game Hub" | "Select a game"

// Main section
"{game} Game" (e.g., "Caro Game")
"Challenge your friends to an exciting game of strategy and skill"

// Buttons
"Create New Game" | "Create Game" | "🚀 Create Game"
"Join Game" | "🎮 Join Game"
"Profile" | "Leaderboard" | "History" | "Logout"
"Login / Register" | "Continue as Guest"

// Game controls
"Board Size"
"Block Two Ends: ON" | "Block Two Ends: OFF"

// Form & validation
"Room Code"
"ABC123" (placeholder)
"Room code must be 6 characters (A-Z, 0-9)"
"This game is already full or finished"

// Game selection
"Caro" (game name)
"Classic strategy game" (description)
"Soon"
"Logged in as"
"👤 Logged in as"

// Game section
"Available Games"
"Join a game that's waiting for players"
"No games waiting for players. Create a new game to get started!"

// Loading
"Joining..."
```

---

### 2. LoginPage.tsx - CRITICAL
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LoginPage.tsx`

**Strings cần dịch (~15):**
```
// Tabs
"Login" | "Register"

// Headers
"🔐 Login" | "✨ Register"
"Welcome back!" | "Create your account"

// Form labels
"Email" | "Username" | "Password"

// Buttons
"Login" | "Register" | "Continue as Guest"
"Logging in..." | "Registering..."
```

---

### 3. GameRoomPage.tsx - CRITICAL
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/pages/GameRoomPage.tsx`

**Strings cần dịch (~25):**
```
// Loading
"Loading game..."

// Dialog
"⚠️ Leave Game?"
"Are you sure you want to leave this game?"
"The game is still in progress!"

// Buttons
"Cancel" | "Leave" | "Leaving..."

// Game status
"⏳ Waiting for player..."
"Share the room code with another player to start the game"

// Game start
"🎮 Start Game"
"Ready to play! Click to start"
"⚡ Who clicks Start goes first!"

// Player info
"Player 1" | "Player 2"
"👥 Players & Score"
"(You)" | "- Your Turn!" | "- Their Turn"
"Player {number} Wins!" | "It's a Draw!"

// Score
"Final Score" | "🏆 Final Score"
```

---

### 4. JoinGamePage.tsx - HIGH
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/pages/JoinGamePage.tsx`

**Strings cần dịch (~12):**
```
// Page header
"Join Game"
"Enter the room code to join a game"
"🎯"

// Form
"Room Code"
"ABC123" (placeholder)

// Buttons
"🎮 Join Game" | "Joining..."
"Back to Home" | "← Back to Home"

// Errors
"Room code must be 6 characters (A-Z, 0-9)"
"This game is already full or finished"
"Game not found. Please check the room code."
```

---

### 5. ProfilePage.tsx - MEDIUM
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/pages/ProfilePage.tsx`

**Strings cần dịch (~12):**
```
// Header
"👤 Profile"

// User info
"Please login to view your profile"

// Game stats section
"📊 Game Statistics"

// Stats labels
"Wins" | "Losses" | "Draws" | "Total Score"

// Empty states
"No game statistics yet. Start playing to see your stats!"
"No statistics available for this game yet."

// Last played
"Last played: {date}"

// Tab names (nếu có multiple games)
"Caro" (game name)
```

---

### 6. LeaderboardPage.tsx - MEDIUM
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LeaderboardPage.tsx`

**Strings cần dịch (~12):**
```
// Header
"🏆 Leaderboard"
"Top players ranked by score - CARO"

// Tabs
"Daily" | "Weekly" | "All Time"

// User rank
"Your Rank: #{rank} out of {total} players"

// Table headers
"Rank" | "Username" | "Wins" | "Score"

// Empty state
"No players yet. Be the first!"
```

---

## II. COMPONENTS - 4 FILES (PRIORITY 1-2)

### 7. GameControls.tsx - CRITICAL
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameControls/GameControls.tsx`

**Strings cần dịch (~30):**
```
// Game buttons
"Start Game"
"Request Undo" | "Waiting for response..."
"Surrender"
"New Game"
"Leave Game" | "Leaving..."

// Confirmation
"Are you sure you want to surrender?"

// Undo dialog
"Undo Request"
"Your opponent wants to undo the last move. Do you approve?"
"Reject" | "Approve"

// Snackbar
"Undo request sent! Waiting for opponent's response..."

// Winner modal title
"It's a Draw!"
"{username} (You) Wins!"
"{username} Wins!"
"Player {number} Wins!"
"🎉 Congratulations!"
"😔 Better luck next time!"

// Winner modal content
"🏆 Final Score"
"Player 1" | "Player 2"

// Leave dialog
"⚠️ Leave Game?"
"Are you sure you want to leave this game? The game is still in progress!"

// Dialog buttons
"Leave Room" | "Play Again"
"Cancel" | "Leave"
```

---

### 8. GameInfo.tsx - HIGH
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameInfo/GameInfo.tsx`

**Strings cần dịch (~15):**
```
// Status section
"📊 Game Status"
"Waiting for players..."
"Player {number}'s turn"
"Draw!"
"Player {number} wins!"
"Game abandoned"

// Players section
"👥 Players"
"(Guest)"

// Rules section
"⚙️ Game Rules"
"Block Two Ends:" | "Allow Undo:"
"✓ ON" | "✗ OFF"
```

---

### 9. GameCard.tsx - MEDIUM
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameCard/GameCard.tsx`

**Strings cần dịch (~8):**
```
// Status
"1/2 Players" | "Waiting"

// Host
"Host: {username}"

// Button states
"Join Game"
"Joining..."
"Playing..."
"Full (2/2)"
```

---

### 10. RoomCodeDisplay.tsx - MEDIUM
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/components/RoomCodeDisplay.tsx`

**Strings cần dịch (~2):**
```
// Label (default parameter)
"Room Code"

// Snackbar message
"Room code copied to clipboard!"
```

---

### 11. HistoryModal.tsx - MEDIUM
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/components/HistoryModal/HistoryModal.tsx`

**Strings cần dịch (~15):**
```
// Modal title
"📜 Game History"
"🎯 Game Board"

// Buttons
"← Back to List"
"Close"

// Empty state
"No game history found. Play some games to see your history here!"

// History list
"vs {opponent}"
"{boardSize}x{boardSize} board"
"Score: {p1} - {p2}"

// Result labels
"Win" | "Loss" | "Draw" | "Unknown"

// Game details
"Game Details"
"Opponent" | "Board Size" | "Final Score"
```

---

## III. UTILITIES - TIME FORMATTING

### 12. timeFormat.ts - MEDIUM
**Đường dẫn:** `/Users/admin/Downloads/caro-hopee/frontend/src/utils/timeFormat.ts`

**Strings cần dịch (~10):**
```
// Relative time
"Just now"
"{n} min{s} ago"     (e.g., "2 mins ago", "1 min ago")
"{n} hour{s} ago"    (e.g., "3 hours ago", "1 hour ago")
"{n} day{s} ago"     (e.g., "5 days ago", "1 day ago")

// Date format (locale-specific)
Date with format: "month short, day, hour:minute"
Example: "Jan 18, 02:30 PM"
```

---

## IV. FILES KHÔNG CẦN DỊCH

```
- App.tsx (Routing only)
- constants.ts (API URLs)
- services/api.ts (API client)
- services/socketService.ts (Socket client)
- contexts/* (Logic handlers)
- types/* (TypeScript types)
- utils/roomCode.ts (Code formatting)
- utils/guestId.ts (Guest ID)
- ErrorBoundary.tsx (Fallback)
```

---

## PRIORITY RANKING

### PRIORITY 1 - CRITICAL (Làm trước)
1. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/HomePage.tsx` (45 strings)
2. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LoginPage.tsx` (15 strings)
3. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/GameRoomPage.tsx` (25 strings)
4. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameControls/GameControls.tsx` (30 strings)
5. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameInfo/GameInfo.tsx` (15 strings)

**Tổng: 130 strings**

---

### PRIORITY 2 - HIGH (Làm tiếp)
6. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/JoinGamePage.tsx` (12 strings)
7. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameCard/GameCard.tsx` (8 strings)
8. `/Users/admin/Downloads/caro-hopee/frontend/src/components/RoomCodeDisplay.tsx` (2 strings)

**Tổng: 22 strings**

---

### PRIORITY 3 - MEDIUM (Làm sau)
9. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/ProfilePage.tsx` (12 strings)
10. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LeaderboardPage.tsx` (12 strings)
11. `/Users/admin/Downloads/caro-hopee/frontend/src/components/HistoryModal/HistoryModal.tsx` (15 strings)
12. `/Users/admin/Downloads/caro-hopee/frontend/src/utils/timeFormat.ts` (10 strings)

**Tổng: 49 strings**

---

## STRING CATEGORIES & I18N STRATEGY

### 1. Simple Labels & Button Text
```typescript
// Mapping approach
const strings = {
  common: {
    login: "Login",
    logout: "Logout",
    cancel: "Cancel"
  },
  buttons: {
    create: "Create Game",
    join: "Join Game"
  }
}
```

### 2. Dynamic Messages (Interpolation)
```typescript
// Template strings
`Player ${playerNumber}'s turn`
`${username} Wins!`
`Your Rank: #${rank} out of ${total} players`
```

### 3. Form Labels & Validation
```typescript
// Dedicated keys
form: {
  labels: {
    email: "Email",
    password: "Password"
  },
  errors: {
    invalidCode: "Room code must be 6 characters"
  }
}
```

### 4. Dialog Content
```typescript
// Hierarchical keys
dialogs: {
  leaveGame: {
    title: "Leave Game?",
    message: "Are you sure...",
    buttons: {
      confirm: "Leave",
      cancel: "Cancel"
    }
  }
}
```

### 5. Status Messages
```typescript
// Status enums
gameStatus: {
  waiting: "Waiting for players...",
  playing: "Player {number}'s turn",
  finished: "Game finished"
}
```

---

## RECOMMENDED I18N LIBRARY

**Recommended:** `i18next` hoặc `react-intl`

Tại sao:
- Hỗ trợ interpolation tốt
- Lazy loading locale
- Fallback language
- Namespace support
- Browser detection

**Alternative:** Custom hook (nếu cần lightweight)

---

## IMPLEMENTATION CHECKLIST

- [ ] Tạo folder `src/locales/`
- [ ] Tạo file `vi.json` và `en.json`
- [ ] Extract tất cả hardcoded strings từ Priority 1 files
- [ ] Setup i18n library (i18next recommended)
- [ ] Replace strings trong Priority 1 files
- [ ] Test tiếng Việt + tiếng Anh
- [ ] Lặp lại với Priority 2 files
- [ ] Lặp lại với Priority 3 files
- [ ] Config language switcher UI
- [ ] Setup locale persistence (localStorage)

---

## NOTES

1. **Game terminology:** Giữ nguyên tên trò chơi ("Caro"), "Block Two Ends" có thể dịch hoặc giữ
2. **Emojis:** Giữ emoji (không phải văn bản), chỉ dịch văn bản bên cạnh
3. **Relative times:** File `timeFormat.ts` cần hỗ trợ locale switching
4. **Date formats:** Sử dụng `Intl.DateTimeFormat` cho locale-specific dates
5. **Pluralization:** i18next hỗ trợ rules phức tạp cho số nhiều

---

## UNRESOLVED QUESTIONS

1. Có cần dịch error messages từ backend API responses?
2. Có dùng i18next hay custom solution?
3. Dù dịch game rules (e.g., "Block Two Ends") hay giữ nguyên?
4. Cần support ngôn ngữ nào ngoài Tiếng Việt?
5. Cách xử lý số lượng người chơi (pluralization rules)?

