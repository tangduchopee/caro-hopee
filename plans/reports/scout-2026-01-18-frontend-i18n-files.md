# Frontend Files for i18n Translation

Ngày: 2026-01-18  
Scope: Tất cả file frontend chứa text hiển thị cho người dùng cần dịch sang Tiếng Việt

---

## Tóm tắt

Đã xác định **14 file** chính cần được cập nhật để hỗ trợ đa ngôn ngữ:
- **5 Pages** (UI chính)
- **5 Components** (UI linh hoạt)
- **1 Constants** (config)
- **1 Utilities** (formatters)

Tổng cộng ~2500+ hardcoded strings cần được extract vào translation files.

---

## I. PAGES (5 files) - Ưu tiên cao

### 1. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/HomePage.tsx`
**Mức độ ưu tiên: CRITICAL**  
**Loại text:**
- Game selection labels: "Game Hub", "Select a game", "Caro Game"
- Button labels: "Create New Game", "Create Game", "Join Game", "Login / Register", "Logout", "Profile", "Leaderboard", "History"
- Section titles: "Available Games", "Challenge your friends..."
- Placeholder text: "ABC123", "Board Size"
- Error messages: "Room code must be 6 characters", "This game is already full or finished"
- Empty states: "No games waiting for players. Create a new game to get started!"
- Dialog text: "Join a game that's waiting for players"
- Game card text: "Create New Game", "Set up your game board...", "Join Game", "Enter a room code..."
- Toggle labels: "Block Two Ends: ON/OFF"
- Loading states: "Joining..."

**Total strings: ~45**

---

### 2. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LoginPage.tsx`
**Mức độ ưu tiên: CRITICAL**  
**Loại text:**
- Tab labels: "Login", "Register"
- Headers: "🔐 Login", "✨ Register"
- Subheaders: "Welcome back!", "Create your account"
- Form labels: "Email", "Username", "Password"
- Button labels: "Login", "Register", "Continue as Guest", "Logging in...", "Registering..."
- Error messages: (dynamic - "Login failed", "Registration failed")

**Total strings: ~15**

---

### 3. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/GameRoomPage.tsx`
**Mức độ ưu tiên: CRITICAL**  
**Loại text:**
- Loading text: "Loading game..."
- Dialog titles: "⚠️ Leave Game?"
- Dialog text: "Are you sure you want to leave this game?", "The game is still in progress!"
- Button labels: "Cancel", "Leave", "Leaving..."
- Game status: "⏳ Waiting for player...", "Share the room code with another player to start the game"
- Start button: "🎮 Start Game", "Ready to play! Click to start", "⚡ Who clicks Start goes first!"
- Player info: "Player 1", "Player 2", "👥 Players & Score"
- Score display: "Final Score", "🏆 Final Score"
- Winner messages: "Your Turn!", "Their Turn", "- Your Turn!", "- Their Turn"

**Total strings: ~20**

---

### 4. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/JoinGamePage.tsx`
**Mức độ ưu tiên: HIGH**  
**Loại text:**
- Page title: "Join Game"
- Subtitle: "Enter the room code to join a game"
- Form label: "Room Code"
- Placeholder: "ABC123"
- Button labels: "Join Game", "Joining...", "Back to Home", "← Back to Home"
- Error messages: "Room code must be 6 characters (A-Z, 0-9)", "This game is already full or finished", "Game not found. Please check the room code."

**Total strings: ~10**

---

### 5. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LeaderboardPage.tsx`
**Mức độ ưu tiên: MEDIUM**  
**Loại text:**
- Page title: "🏆 Leaderboard"
- Subtitle: "Top players ranked by score - CARO"
- Tab labels: "Daily", "Weekly", "All Time"
- User rank text: "Your Rank: #{rank} out of {total} players"
- Table headers: "Rank", "Username", "Wins", "Score"
- Empty state: "No players yet. Be the first!"

**Total strings: ~12**

---

### 6. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/ProfilePage.tsx`
**Mức độ ưu tiên: MEDIUM**  
**Loại text:**
- Page title: "👤 Profile"
- Section title: "📊 Game Statistics"
- Tab labels: (Game names - "Caro")
- Stat labels: "Wins", "Losses", "Draws", "Total Score"
- Last played: "Last played: {date}"
- Empty states: "Please login to view your profile", "No game statistics yet. Start playing to see your stats!", "No statistics available for this game yet."

**Total strings: ~12**

---

## II. COMPONENTS (5 files) - Ưu tiên cao

### 7. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameControls/GameControls.tsx`
**Mức độ ưu tiên: CRITICAL**  
**Loại text:**
- Button labels: "Start Game", "Request Undo", "Surrender", "New Game", "Leave Game", "Waiting for response...", "Leaving..."
- Confirmation text: "Are you sure you want to surrender?"
- Dialog title: "Undo Request"
- Dialog content: "Your opponent wants to undo the last move. Do you approve?"
- Button labels: "Reject", "Approve"
- Snackbar: "Undo request sent! Waiting for opponent's response..."
- Winner modal: "It's a Draw!", "{username} (You) Wins!", "{username} Wins!", "Player {number} Wins!"
- Congratulations: "🎉 Congratulations!", "😔 Better luck next time!"
- Score section: "🏆 Final Score", "Player 1", "Player 2"
- Dialog buttons: "Leave Room", "Play Again"
- Leave confirmation: "⚠️ Leave Game?", "Are you sure you want to leave this game? The game is still in progress!"

**Total strings: ~25**

---

### 8. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameInfo/GameInfo.tsx`
**Mức độ ưu tiên: HIGH**  
**Loại text:**
- Section title: "📊 Game Status"
- Status messages: "Waiting for players...", "Player {number}'s turn", "Draw!", "Player {number} wins!", "Game abandoned"
- Players section: "👥 Players", "(Guest)"
- Rules section: "⚙️ Game Rules"
- Rule labels: "Block Two Ends:", "Allow Undo:"
- Rule values: "✓ ON", "✗ OFF"

**Total strings: ~15**

---

### 9. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameCard/GameCard.tsx`
**Mức độ ưu tiên: MEDIUM**  
**Loại text:**
- Player count: "1/2 Players", "Waiting"
- Host label: "Host: {username}"
- Button labels: "Join Game", "Joining...", "Playing...", "Full (2/2)"
- Status labels: (từ game state)

**Total strings: ~8**

---

### 10. `/Users/admin/Downloads/caro-hopee/frontend/src/components/HistoryModal/HistoryModal.tsx`
**Mức độ ưu tiên: MEDIUM**  
*[Cần đọc file để xác định exact strings]*

---

## III. UTILITIES & CONSTANTS

### 11. `/Users/admin/Downloads/caro-hopee/frontend/src/utils/constants.ts`
**Mức độ ưu tiên: LOW**  
**Nội dung:** Chỉ config API URLs - **KHÔNG cần dịch**

---

### 12. `/Users/admin/Downloads/caro-hopee/frontend/src/utils/timeFormat.ts`
**Mức độ ưu tiên: MEDIUM**  
**Loại text:** Relative time formatting ("2 minutes ago", "1 hour ago", etc.) - **CẦN DỌC**

---

### 13. `/Users/admin/Downloads/caro-hopee/frontend/src/App.tsx`
**Mức độ ưu tiên: LOW**  
**Nội dung:** Chỉ routing config - **KHÔNG cần dịch**

---

## IV. OTHER COMPONENTS (Cần kiểm tra thêm)

### 14. `/Users/admin/Downloads/caro-hopee/frontend/src/components/RoomCodeDisplay.tsx`
**Mức độ ưu tiên: MEDIUM**  
*[Cần đọc file]*

---

## V. CONTEXT & SERVICES

**AuthContext.tsx**, **GameContext.tsx**, **SocketContext.tsx** - Chủ yếu xử lý logic, ít text  
**api.ts**, **socketService.ts** - Request/response handling - **KHÔNG cần dịch**

---

## Danh sách file cần update (ưu tiên)

### PRIORITY 1 (Critical - cập nhật trước)
1. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/HomePage.tsx`
2. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LoginPage.tsx`
3. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/GameRoomPage.tsx`
4. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameControls/GameControls.tsx`
5. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameInfo/GameInfo.tsx`

### PRIORITY 2 (High - cập nhật tiếp)
6. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/JoinGamePage.tsx`
7. `/Users/admin/Downloads/caro-hopee/frontend/src/components/GameCard/GameCard.tsx`
8. `/Users/admin/Downloads/caro-hopee/frontend/src/components/RoomCodeDisplay.tsx` *(cần kiểm tra)*

### PRIORITY 3 (Medium - cập nhật sau)
9. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/ProfilePage.tsx`
10. `/Users/admin/Downloads/caro-hopee/frontend/src/pages/LeaderboardPage.tsx`
11. `/Users/admin/Downloads/caro-hopee/frontend/src/components/HistoryModal/HistoryModal.tsx` *(cần kiểm tra)*
12. `/Users/admin/Downloads/caro-hopee/frontend/src/utils/timeFormat.ts`

---

## String Categories & Extract Strategy

### 1. UI Labels & Buttons
- "Create Game", "Join Game", "Login", etc.
- Sử dụng: Object mapping hoặc i18n library (i18next, react-intl)

### 2. Dynamic Messages (Status, Winners)
- "Player {number}'s turn", "{username} Wins!"
- Sử dụng: Template strings với i18n interpolation

### 3. Form Labels & Placeholders
- "Email", "Password", "Room Code"
- Sử dụng: Separate translation keys

### 4. Error Messages
- "Game not found", "Login failed"
- Sử dụng: Error code mapping (e.g., "error.game_not_found")

### 5. Dialog/Modal Text
- Confirmation messages, titles, content
- Sử dụng: Hierarchical keys (e.g., "dialog.leave_game.title")

---

## Recommended i18n Implementation

```json
// src/locales/vi.json
{
  "pages": {
    "home": {
      "title": "Game Hub",
      "game_title": "{game} Game",
      "subtitle": "Thách đấu bạn bè với trò chơi chiến lược",
      "buttons": {
        "create": "Tạo trò chơi",
        "join": "Tham gia trò chơi",
        "login": "Đăng nhập / Đăng ký"
      }
    }
  },
  "components": {
    "gameControls": {
      "start": "Bắt đầu",
      "surrender": "Bỏ cuộc"
    }
  }
}
```

---

## Unresolved Questions

1. Cần đọc file HistoryModal.tsx để xác định exact strings
2. Cần đọc file RoomCodeDisplay.tsx để xác định UI text
3. Cần đọc file timeFormat.ts để xác định relative time messages
4. Error messages từ API responses - có cần dịch trên backend hay chỉ on frontend?
5. Game rules text (e.g., "Block Two Ends") - là game terminology, có nên giữ nguyên?

