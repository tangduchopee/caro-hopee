# Mini Game Caro - Tài Liệu Chức Năng và Logic

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Trạng Thái Game](#trạng-thái-game)
3. [Tạo và Tham Gia Game](#tạo-và-tham-gia-game)
4. [Bắt Đầu Game](#bắt-đầu-game)
5. [Luật Chơi](#luật-chơi)
6. [Điều Khiển Game](#điều-khiển-game)
7. [Rời Game và Quản Lý Host](#rời-game-và-quản-lý-host)
8. [Lịch Sử Game](#lịch-sử-game)
9. [Real-time Updates](#real-time-updates)
10. [Xác Thực và Guest](#xác-thực-và-guest)

---

## 🎮 Tổng Quan

Mini Game Caro là một game cờ caro online multiplayer với các tính năng:
- **Multiplayer Real-time**: 2 người chơi cùng lúc
- **Guest Mode**: Chơi không cần đăng nhập
- **Authenticated Mode**: Chơi với tài khoản, lưu lịch sử vĩnh viễn
- **Multiple Board Sizes**: 3x3, 15x15, 19x19, 20x20
- **Game Rules**: Block Two Ends, Undo, Time Limit
- **Game History**: Xem lại các ván đã chơi
- **Winning Line Visualization**: Hiển thị đường kẻ chiến thắng, và nước đi gần nhất

---

## 📊 Trạng Thái Game

### Lưu ý về Trạng Thái

**Trạng thái trong Database (`gameStatus`)**:
- `waiting`: Chờ người chơi (có thể 1 hoặc 2 người)
- `playing`: Đang chơi
- `finished`: Đã kết thúc

**Trạng thái hiển thị trong UI (`displayStatus`)**:
- `waiting`: Chỉ có 1 người chơi (1/2)
- `ready`: Có đủ 2 người chơi nhưng chưa bắt đầu (2/2, chưa start)
- `playing`: Đang chơi (2/2, đã start)

**Sự khác biệt**:
- Trong DB, khi có 2 người nhưng chưa start → Vẫn là `waiting`
- Trong UI, khi có 2 người nhưng chưa start → Hiển thị là `ready`
- Logic xử lý dựa trên `gameStatus` (DB) và `playerCount` để xác định `displayStatus` (UI)

---

### Chi Tiết Các Trạng Thái

#### 1. `waiting` - Đang chờ người chơi thứ 2 (1/2 players)

**Trong Database**: `gameStatus = 'waiting'`  
**Trong UI**: `displayStatus = 'waiting'`

- **Mô tả**: Game đã được tạo nhưng chỉ có 1 người chơi (host)
- **Điều kiện**: 
  - Chỉ có player1 (host)
  - Chưa có player2
  - `playerCount = 1`
- **UI**: 
  - Hiển thị "Waiting for players..." message
  - Không hiển thị bàn cờ
  - Không hiển thị Start button
- **Hành động cho phép**: 
  - ✅ Join game (cho người chơi khác)
  - ❌ Start game (chưa đủ 2 người)
- **Logic xử lý**: 
  - Game hiển thị trong lobby với status "Waiting (1/2)"
  - `canJoin = true` (có thể join)
  - Không thể start
  - Sau khi có người join → Chuyển sang trạng thái `ready` (2/2, chưa start)

**Lưu ý**: 
- Khi `playerCount = 1` → `gameStatus = 'waiting'`, `displayStatus = 'waiting'` (1/2)
- Khi `playerCount = 2` và chưa start → `gameStatus = 'waiting'`, `displayStatus = 'ready'` (2/2)
- Khi đã start → `gameStatus = 'playing'`, `displayStatus = 'playing'`

### 2. `playing` - Đang chơi
- **Mô tả**: Game đã bắt đầu, 2 người chơi đang đánh
- **Điều kiện**: 
  - Có đủ 2 người chơi
  - Đã click "Start Game"
  - `gameStatus = 'playing'`
- **UI**: Hiển thị bàn cờ đầy đủ, nút điều khiển, game info
- **Hành động cho phép**: 
  - ✅ Make move (theo lượt)
  - ✅ Request undo (nếu đủ điều kiện)
  - ✅ Surrender
  - ❌ Join game (đã đủ 2 người và đang chơi)
  - ❌ Start game (đã bắt đầu rồi)
- **Logic xử lý**: 
  - Game hiển thị trong lobby với status "Playing"
  - Không thể join
  - Có thể đánh cờ, undo, surrender

#### 4. `finished` - Đã kết thúc

**Trong Database**: `gameStatus = 'finished'`  
**Trong UI**: `displayStatus = 'finished'` (không hiển thị trong lobby)
- **Mô tả**: Game đã kết thúc (có người thắng hoặc hòa)
- **Điều kiện**: 
  - Có 5 dấu liên tiếp (hoặc 3 cho bàn 3x3) → `winner = 1 hoặc 2`
  - Hoặc bàn cờ đầy (draw) → `winner = 'draw'`
  - Hoặc có người đầu hàng → `winner = opponent`
- **UI**: 
  - Hiển thị modal "Play Again" với kết quả
  - Đường kẻ chiến thắng (nếu có người thắng)
  - Final score
- **Hành động cho phép**: 
  - ✅ Play Again (new game)
  - ✅ Leave game
  - ❌ Make move (đã kết thúc)
- **Logic xử lý**: 
  - Game không hiển thị trong lobby (đã finished)
  - Không thể join
  - Có thể play again hoặc leave

---

## 🎯 Tạo và Tham Gia Game

### Tạo Game (`createGame`)

**Endpoint**: `POST /api/games/create`

**Logic xử lý**:
1. **Xác thực người chơi**:
   - Nếu có JWT token → Authenticated user
   - Nếu không có token → Guest user
   - Lưu `player1` = userId (nếu authenticated) hoặc `player1GuestId` = guestId

2. **Tạo game**:
   - Tạo `roomId` (UUID)
   - Tạo `roomCode` (6 ký tự A-Z, 0-9, unique)
   - Khởi tạo bàn cờ rỗng
   - Set `gameStatus = 'waiting'` (chỉ có 1 người chơi)
   - Lưu rules (blockTwoEnds, allowUndo, maxUndoPerGame, timeLimit)

3. **Emit Socket Event**:
   - `game-created`: Gửi đến tất cả clients trong lobby
   - Data: `{ roomId, roomCode, boardSize, gameStatus, player1Username, createdAt }`

4. **Response**: Trả về game data với `roomId` và `roomCode`

**Kết quả**: Game được tạo với trạng thái `waiting` (1/2 players), chỉ có player1

---

### Tham Gia Game (`joinGame`)

**Endpoint**: `POST /api/games/:roomId/join`

**Logic xử lý**:
1. **Kiểm tra game tồn tại**: Tìm game theo `roomId`

2. **Kiểm tra điều kiện join**:
   - ❌ Game đang `playing` → Không cho join
   - ❌ Game không phải `waiting` → Không cho join
   - ❌ Game đã đủ 2 người (`hasPlayer1 && hasPlayer2`) → Không cho join
   - ✅ Game đang `waiting` và chưa đủ 2 người → Cho phép join

3. **Kiểm tra người chơi đã trong game**:
   - Nếu user đã là player1 hoặc player2 → Trả về game data (không join lại)

4. **Gán player2**:
   - Nếu authenticated → `player2 = userId`, `player2GuestId = null`
   - Nếu guest → `player2 = null`, `player2GuestId = guestId`

5. **Emit Socket Events**:
   - `player-joined`: Gửi đến room (thông báo player2 đã join)
   - `game-status-updated`: Gửi đến lobby (cập nhật status từ `waiting` 1/2 → `ready` 2/2)

6. **Response**: Trả về game data đã cập nhật

**Kết quả**: Game có đủ 2 người chơi, trạng thái vẫn là `waiting` (chưa bắt đầu)

---

## 🚀 Bắt Đầu Game

### Start Game (`start-game` socket event)

**Logic xử lý**:
1. **Kiểm tra điều kiện**:
   - Game phải ở trạng thái `waiting` (trong DB)
   - Phải có đủ 2 người chơi (`player2` hoặc `player2GuestId`)
   - Trạng thái hiển thị phải là `ready` (2/2 players)

2. **Xác định người đi trước**:
   - Người click "Start Game" sẽ đi trước
   - Xác định bằng cách so sánh `socketData.userId` hoặc `socketData.playerId` với `game.player1/player2` hoặc `game.player1GuestId/player2GuestId`
   - Nếu không xác định được → Mặc định player1 đi trước

3. **Cập nhật game**:
   - `gameStatus = 'playing'` (chuyển từ `waiting` sang `playing`)
   - `currentPlayer = startingPlayer` (người click start)

4. **Emit Socket Events**:
   - `game-started`: Gửi đến room với `currentPlayer`
   - `game-status-updated`: Gửi đến lobby (cập nhật status từ `ready` → `playing`)

**Kết quả**: 
- Game chuyển từ trạng thái `ready` (2/2, chưa bắt đầu) sang `playing` (đang chơi)
- Người click start đi trước
- Có thể bắt đầu đánh cờ

---

## 🎲 Luật Chơi

### 1. Win Condition (Điều Kiện Thắng)

**Logic**: `checkWin(board, row, col, player, boardSize, blockTwoEnds)`

**Quy tắc**:
- **Bàn 3x3**: Cần 3 dấu liên tiếp
- **Bàn khác (15x15, 19x19, 20x20)**: Cần 5 dấu liên tiếp
- **Hướng thắng**: Horizontal, Vertical, Diagonal (\), Diagonal (/)

**Cách kiểm tra**:
1. Từ vị trí vừa đánh, kiểm tra 4 hướng
2. Đếm số dấu liên tiếp về mỗi phía (positive và negative direction)
3. Nếu tổng >= winCount (3 hoặc 5) → Thắng
4. Lưu `winningLine`: Mảng các cell tạo thành đường thắng

**Block Two Ends Rule**:
- Nếu `blockTwoEnds = true`:
  - Kiểm tra 2 đầu của đường 5 dấu
  - Nếu cả 2 đầu đều bị chặn (bởi đối thủ hoặc biên) → Không tính là thắng
  - Pattern: `x o o o o o x` → Không thắng

**Kết quả**: Trả về `{ isWin: boolean, winningLine?: Array<{row, col}> }`

---

### 2. Block Two Ends Rule (Chặn 2 Đầu)

**Mô tả**: Ngăn chặn nước đi sẽ chặn cả 2 đầu của đường 4 dấu mở của đối thủ

**Logic**: `checkBlockTwoEnds(game, row, col, player)`

**Cách hoạt động**:
1. Quét bàn cờ tìm các chuỗi 4 dấu liên tiếp của đối thủ
2. Kiểm tra 2 đầu của chuỗi:
   - End 1 (negative direction): Cell trước chuỗi
   - End 2 (positive direction): Cell sau chuỗi
3. Nếu cả 2 đầu đều mở (empty):
   - Kiểm tra nước đi hiện tại có đặt ở 1 trong 2 đầu không
   - Nếu có và đầu kia đã bị chặn → Không cho phép đi
   - Mục đích: Ngăn chặn việc chặn cả 2 đầu của đường 4 mở

**Ví dụ**:
```
Bàn cờ: _ o o o o _
Nước đi: X vào đầu trái → Chặn 1 đầu → Cho phép
Nước đi: X vào đầu phải → Chặn 1 đầu → Cho phép
Nước đi: X vào đầu trái khi đầu phải đã bị chặn → Chặn cả 2 đầu → Không cho phép
```

---

### 3. Undo Move (Hoàn Tác)

**Mô tả**: Cho phép người chơi yêu cầu hoàn tác nước đi của mình

**Điều kiện**:
- `allowUndo = true` trong rules
- Số lần undo chưa vượt quá `maxUndoPerGame` (mặc định: 3)
- Chỉ có thể undo nước đi của chính mình
- Không thể undo ở lượt đầu tiên (chưa có đủ moves)

**Quy trình**:
1. **Request Undo** (`request-undo`):
   - Player gửi `{ roomId, moveNumber }`
   - Server tìm move và emit `undo-requested` đến đối thủ
   - Frontend hiển thị dialog xác nhận cho đối thủ

2. **Approve Undo** (`approve-undo`):
   - Đối thủ chấp nhận → Gọi `undoMove(game, moveNumber)`
   - Logic:
     - Tìm move trong database
     - Xóa dấu trên bàn cờ (`board[row][col] = 0`)
     - Đánh dấu move là `isUndone = true`
     - Revert `currentPlayer` về người đã undo
     - Set `gameStatus = 'playing'` (nếu đã finished)
   - Emit `undo-approved` với board mới

3. **Reject Undo** (`reject-undo`):
   - Đối thủ từ chối → Emit `undo-rejected`
   - Game tiếp tục như bình thường

**Giới hạn**:
- Chỉ undo được nước đi của chính mình
- Tối đa `maxUndoPerGame` lần undo trong 1 game
- Không thể undo khi game đã finished

---

### 4. Draw (Hòa)

**Điều kiện**: Bàn cờ đầy (tất cả cells đều != 0) và không có người thắng

**Logic**:
- Kiểm tra sau mỗi nước đi
- Nếu `isBoardFull && !isWin` → `winner = 'draw'`, `gameStatus = 'finished'`

---

### 5. Surrender (Đầu Hàng)

**Mô tả**: Người chơi tự nguyện đầu hàng

**Logic**:
1. Xác định người đầu hàng (player1 hoặc player2)
2. Set `winner = opponent` (đối thủ thắng)
3. Set `gameStatus = 'finished'`
4. Tăng score cho người thắng
5. Emit `game-finished` với reason "Opponent surrendered"

---

## 🎮 Điều Khiển Game

### Make Move (Đánh Cờ)

**Socket Event**: `make-move`

**Logic xử lý**:
1. **Xác định người chơi**:
   - Kiểm tra `socketData.userId` (authenticated) hoặc `socketData.playerId` (guest)
   - So sánh với `game.player1/player2` hoặc `game.player1GuestId/player2GuestId`
   - Xác định `player` (1 hoặc 2)

2. **Validate Move**:
   - Kiểm tra `currentPlayer === player` (đúng lượt)
   - Kiểm tra `gameStatus === 'playing'` (game đang chơi)
   - Kiểm tra `board[row][col] === 0` (cell trống)
   - Kiểm tra bounds (row, col trong phạm vi)
   - Kiểm tra Block Two Ends rule (nếu enabled)

3. **Thực hiện nước đi**:
   - `board[row][col] = player`
   - `currentPlayer = player === 1 ? 2 : 1` (đổi lượt)
   - Lưu move vào `GameMove` collection

4. **Kiểm tra thắng**:
   - Gọi `checkWin()` → Trả về `{ isWin, winningLine }`
   - Nếu thắng:
     - `gameStatus = 'finished'`
     - `winner = player`
     - `finishedAt = new Date()`
     - Lưu `winningLine` vào game
     - Tăng score cho người thắng
   - Nếu hòa (board full):
     - `gameStatus = 'finished'`
     - `winner = 'draw'`
     - `finishedAt = new Date()`

5. **Emit Socket Events**:
   - `move-made`: Gửi đến room với board mới và currentPlayer
   - Nếu finished: `game-finished` với winner và reason
   - `score-updated`: Cập nhật score

**Kết quả**: Bàn cờ được cập nhật, lượt chơi đổi, hoặc game kết thúc

---

### New Game (Chơi Lại)

**Socket Event**: `new-game`

**Logic xử lý**:
1. Reset bàn cờ về trạng thái rỗng
2. Giữ nguyên score (không reset)
3. `currentPlayer = 1`
4. `gameStatus = 'playing'`
5. `winner = null`
6. `finishedAt = null`
7. Emit `move-made` với board mới

**Kết quả**: Game mới bắt đầu với score cũ được giữ lại

---

## 🚪 Rời Game và Quản Lý Host

### Leave Game (`leaveGame` API)

**Endpoint**: `POST /api/games/:roomId/leave`

**Logic xử lý chi tiết**:

#### Bước 1: Xác định người rời
- Kiểm tra authenticated user (`authReq.user?.userId`)
- Kiểm tra guest (`guestId`)
- Xác định `isPlayer1` hoặc `isPlayer2`

#### Bước 2: Kiểm tra trạng thái trước khi rời
- `hasPlayer1Before`: Có player1 trước khi rời?
- `hasPlayer2Before`: Có player2 trước khi rời?
- `wasFinished`: Game đã finished trước khi rời?

#### Bước 3: Xóa người chơi khỏi game
- Nếu `isPlayer1` → `game.player1 = null`, `game.player1GuestId = null`
- Nếu `isPlayer2` → `game.player2 = null`, `game.player2GuestId = null`

#### Bước 4: Kiểm tra trạng thái sau khi rời
- `hasPlayer1After`: Còn player1 sau khi rời?
- `hasPlayer2After`: Còn player2 sau khi rời?
- `hasNoPlayers`: Không còn người chơi nào?

---

### Case 1: Game Finished + Cả 2 Player Rời → Lưu History và Xóa Game

**Điều kiện**:
- `hasNoPlayers = true` (không còn người chơi nào)
- `game.gameStatus === 'finished'`
- `game.finishedAt` tồn tại

**Logic xử lý**:
1. **Kiểm tra có authenticated player không**:
   - `hasAuthenticatedPlayer = !!(game.player1 || game.player2)`
   
2. **Nếu có authenticated player**:
   - Tạo `GameHistory` record:
     - Lưu tất cả thông tin game (board, winner, score, rules, winningLine)
     - `player1GuestId = null`, `player2GuestId = null` (không lưu guest IDs)
     - `savedAt = new Date()`
   - Lưu vào database
   - Cleanup old history (giữ lại 50 games gần nhất cho mỗi authenticated user)
   
3. **Nếu chỉ có guest players**:
   - Không lưu vào database
   - Frontend sẽ tự lưu vào localStorage

4. **Xóa game**:
   - `Game.deleteOne({ roomId })`

5. **Emit Socket Events**:
   - `game-deleted`: Gửi đến tất cả clients trong lobby (không chỉ room)
   - Data: `{ roomId }`

**Kết quả**: Game bị xóa, history được lưu (nếu có authenticated user), UI cập nhật real-time

---

### Case 2: Game Finished + 1 Player Rời → Reset Về Waiting (1/2)

**Điều kiện**:
- `hasNoPlayers = false` (còn 1 người chơi)
- `wasFinished = true` (game đã finished)

**Logic xử lý**:
1. **Host Transfer** (nếu player1 rời):
   - Nếu `isPlayer1 && hasPlayer2After`:
     - `game.player1 = game.player2` (chuyển player2 thành player1)
     - `game.player1GuestId = game.player2GuestId`
     - `game.player2 = null`
     - `game.player2GuestId = null`
     - `hostTransferred = true`

2. **Reset Game**:
   - `gameStatus = 'waiting'` (chuyển từ `finished` về `waiting` - chỉ có 1 người)
   - `winner = null`
   - `finishedAt = null`
   - Reset board về trạng thái rỗng
   - `currentPlayer = 1`
   - `gameReset = true`

3. **Emit Socket Events**:
   - `player-left`: Gửi đến room với `hostTransferred` và `gameReset`
   - `game-status-updated`: Gửi đến lobby (cập nhật status từ `finished` → `waiting` 1/2)

**Kết quả**: 
- Game reset về `waiting` (1/2 players)
- Người còn lại trở thành host (nếu host cũ rời)
- Có thể chờ người chơi mới join
- UI hiển thị "Waiting for players..."

---

### Case 3: Game Chưa Finished + Cả 2 Player Rời → Xóa Game

**Điều kiện**:
- `hasNoPlayers = true`
- `game.gameStatus !== 'finished'` (chưa finished)

**Logic xử lý**:
1. Xóa game trực tiếp: `Game.deleteOne({ roomId })`
2. Không lưu history (vì game chưa kết thúc)

3. **Emit Socket Events**:
   - `game-deleted`: Gửi đến tất cả clients trong lobby

**Kết quả**: Game bị xóa, không lưu history

---

### Case 4: Game Playing + 1 Player Rời → Reset Về Waiting (1/2)

**Điều kiện**:
- `hasNoPlayers = false` (còn 1 người chơi)
- `game.gameStatus === 'playing'` (đang chơi)

**Logic xử lý**:
1. **Host Transfer** (nếu player1 rời):
   - Nếu `isPlayer1 && hasPlayer2After`:
     - `game.player1 = game.player2` (chuyển player2 thành player1)
     - `game.player1GuestId = game.player2GuestId`
     - `game.player2 = null`
     - `game.player2GuestId = null`
     - `hostTransferred = true`

2. **Reset Game**:
   - `gameStatus = 'waiting'` (chuyển từ `playing` về `waiting` - chỉ có 1 người)
   - `winner = null`
   - `finishedAt = null`
   - Reset board về trạng thái rỗng
   - `currentPlayer = 1`
   - `gameReset = true`

3. **Emit Socket Events**:
   - `player-left`: Gửi đến room với `hostTransferred` và `gameReset`
   - `game-status-updated`: Gửi đến lobby (cập nhật status từ `playing` → `waiting` 1/2)

**Kết quả**: 
- Game reset về `waiting` (1/2 players)
- Người còn lại trở thành host (nếu host cũ rời)
- Có thể chờ người chơi mới join
- UI hiển thị "Waiting for players..."

---

### Disconnect Handler (Socket)

**Khi socket disconnect** (browser đóng, mất mạng, v.v.):

**Logic xử lý**:
1. Tìm game mà player đang tham gia (`socketData.currentRoomId`)
2. Xác định player đang disconnect (tương tự `leaveGame`)
3. **Thực hiện logic giống `leaveGame`**:
   - Xóa player khỏi game
   - Xử lý các case 1-4 như trên
   - Lưu history nếu cần
   - Emit socket events

**Lưu ý**: Logic disconnect phải giống hệt `leaveGame` để đảm bảo consistency

---

## 📚 Lịch Sử Game

### Lưu Lịch Sử

#### Authenticated Users
- **Lưu vào Database**: `GameHistory` collection
- **Khi nào lưu**: Khi game finished và cả 2 player rời (Case 1)
- **Dữ liệu lưu**:
  - Board state (trạng thái bàn cờ)
  - Winner và winningLine
  - Score
  - Rules
  - Players (chỉ authenticated users, không lưu guest IDs)
  - Timestamps (createdAt, finishedAt, savedAt)
- **Giới hạn**: Giữ lại 50 games gần nhất cho mỗi user
- **Cleanup**: Tự động xóa games cũ hơn 50

#### Guest Users
- **Lưu vào localStorage**: Không lưu vào database
- **Khi nào lưu**: Khi game finished (trong `handleGameFinished` của GameContext)
- **Dữ liệu lưu**: Tương tự authenticated nhưng lưu vào localStorage
- **Giới hạn**: Tối đa 20 games
- **Lưu ý**: 
  - Chỉ tồn tại khi tab còn mở
  - Tắt tab → Mất lịch sử
  - Mỗi tab có localStorage riêng

---

### Đọc Lịch Sử

#### Authenticated Users
- **API**: `POST /api/games/history`
- **Logic**:
  - Query database với `player1 = userId OR player2 = userId`
  - Sắp xếp theo `finishedAt` giảm dần
  - Limit 50 games
  - Format response với `result` (win/loss/draw) và `opponentUsername`

#### Guest Users
- **Source**: localStorage
- **Logic**:
  - Đọc từ `localStorage.getItem('caro_guest_history')`
  - Parse JSON
  - Validate và filter invalid entries
  - Trả về tối đa 20 games

---

### Hiển Thị Lịch Sử

**Component**: `HistoryModal`

**Tính năng**:
- Hiển thị danh sách games (list view)
- Click vào game → Xem bàn cờ (board view)
- Hiển thị:
  - Result (Win/Loss/Draw) với màu sắc
  - Opponent username
  - Board size
  - Final score
  - Finished date
  - **Winning line**: Đường kẻ đỏ trên 5 dấu thắng (nếu có)

**Winning Line Visualization**:
- Highlight các cell trong winning line (border đỏ, background gradient)
- Vẽ SVG line từ cell đầu đến cell cuối
- Áp dụng cho cả game đang chơi và lịch sử

---

## 🔄 Real-time Updates

### Socket.IO Events

#### Client → Server Events:
- `join-room`: Tham gia socket room
- `leave-room`: Rời socket room
- `make-move`: Đánh cờ
- `request-undo`: Yêu cầu undo
- `approve-undo`: Chấp nhận undo
- `reject-undo`: Từ chối undo
- `surrender`: Đầu hàng
- `start-game`: Bắt đầu game
- `new-game`: Chơi lại

#### Server → Client Events:
- `room-joined`: Đã tham gia room
- `player-joined`: Có người chơi mới join
- `player-left`: Có người chơi rời
- `game-deleted`: Game bị xóa
- `move-made`: Có nước đi mới
- `undo-requested`: Có yêu cầu undo
- `undo-approved`: Undo được chấp nhận
- `undo-rejected`: Undo bị từ chối
- `game-finished`: Game kết thúc
- `game-started`: Game bắt đầu
- `game-error`: Có lỗi xảy ra
- `score-updated`: Score được cập nhật
- `game-created`: Game mới được tạo (lobby)
- `game-status-updated`: Game status thay đổi (lobby)

---

### HomePage Real-time Updates

**Tính năng**: Cập nhật danh sách game real-time không bị flickering

**Cơ chế**:
1. **Socket Listeners**:
   - `game-created`: Game mới được tạo → Reload list (silent)
   - `game-status-updated`: Game status thay đổi → Reload list (silent)
   - `game-deleted`: Game bị xóa → Xóa khỏi list ngay lập tức

2. **Smart Merge**:
   - Chỉ update phần thay đổi, không replace toàn bộ array
   - So sánh từng game để phát hiện thay đổi
   - Track mounted games để animation optimization

3. **Conditional Animation**:
   - Game mới: Animate với timeout 400ms
   - Game update: Không animate (timeout 0ms)

4. **Fallback Polling**:
   - Interval 30s (tăng từ 5s) để đảm bảo sync nếu socket fail

---

## 🔐 Xác Thực và Guest

### Guest Mode

**Cơ chế**:
- Mỗi tab có `guestId` riêng (lưu trong `sessionStorage`)
- Format: `guest_${timestamp}_${random}`
- Tự động tạo khi cần

**Hạn chế**:
- Lịch sử chỉ lưu trong localStorage (tạm thời)
- Không lưu vào database
- Mất khi tắt tab

---

### Authenticated Mode

**Cơ chế**:
- Sử dụng JWT token
- User ID được lưu trong `player1`/`player2` (ObjectId)
- Username được populate từ User model

**Lợi ích**:
- Lịch sử lưu vĩnh viễn trong database
- Có thể xem lại khi đăng nhập lại
- Game stats tracking

---

### Mixed Mode (Authenticated + Guest)

**Hỗ trợ**:
- Authenticated user có thể chơi với Guest
- Game lưu cả `player1` (authenticated) và `player2GuestId` (guest)
- Khi lưu history: Chỉ lưu authenticated user, không lưu guest ID

---

## 🎨 UI Features

### Game Board
- **Responsive**: Tự động resize theo container
- **Cell Highlighting**: 
  - Last move: Border và background gradient
  - Winning cells: Border đỏ dày, background đỏ, box shadow
- **Winning Line**: SVG overlay với đường kẻ đỏ

### Game Controls
- **Start Game Button**: Chỉ hiện khi đủ 2 người và game đang `waiting`
- **Request Undo**: 
  - Chỉ hiện khi đủ điều kiện (không phải lượt đầu, chưa vượt limit)
  - Visual feedback khi gửi request
- **Surrender Button**: Luôn hiện khi game đang `playing`

### Game Info
- **Current Rules Display**: Hiển thị rules hiện tại
- **Score Display**: Hiển thị score của cả 2 người chơi
- **Player Info**: Hiển thị thông tin người chơi

### Waiting State
- **UI**: Hiển thị "Waiting for players..." message
- **Không hiện**: Bàn cờ và Start button (chỉ hiện khi đủ 2 người)

---

## 🔧 Technical Details

### Database Models

#### Game Model
- `roomId`: UUID unique
- `roomCode`: 6 ký tự unique
- `player1`/`player2`: ObjectId (authenticated) hoặc null
- `player1GuestId`/`player2GuestId`: String (guest) hoặc null
- `board`: 2D array (0 = empty, 1 = player1, 2 = player2)
- `gameStatus`: 'waiting' | 'playing' | 'finished'
  - **Lưu ý**: `abandoned` không được sử dụng trong code
  - **Display Status** (trong UI): 'waiting' (1/2) | 'ready' (2/2, chưa start) | 'playing' (2/2, đang chơi)
- `winner`: 1 | 2 | null | 'draw'
- `winningLine`: Array<{row, col}>
- `rules`: { blockTwoEnds, allowUndo, maxUndoPerGame, timeLimit }
- `score`: { player1, player2 }

#### GameHistory Model
- Tương tự Game nhưng:
  - Không có `currentPlayer`
  - Có `savedAt`: Thời điểm lưu history
  - `player1GuestId`/`player2GuestId`: Không lưu (null) cho authenticated games

#### GameMove Model
- Lưu từng nước đi
- `isUndone`: Đánh dấu đã bị undo
- Dùng để track undo count và undo moves

---

### Frontend State Management

#### GameContext
- Quản lý game state, socket connection
- Handle các socket events
- Lưu guest history vào localStorage
- Submit game stats cho authenticated users

#### Smart State Updates
- Sử dụng functional updates để tránh stale closures
- Track `isMounted` để tránh memory leaks
- Cleanup timeouts và socket listeners

---

## 📝 Tóm Tắt Logic Quan Trọng

### 1. Host Transfer
- **Khi nào**: Player1 (host) rời, Player2 còn lại
- **Logic**: Chuyển Player2 thành Player1, xóa Player2
- **Kết quả**: Player2 trở thành host mới

### 2. Game Reset
- **Khi nào**: 
  - Game finished + 1 player rời → Reset về `waiting` (1/2)
  - Game playing + 1 player rời → Reset về `waiting` (1/2)
- **Logic**: 
  - Reset board về trạng thái rỗng
  - `gameStatus = 'waiting'` (chỉ có 1 người chơi)
  - Xóa winner, finishedAt
  - Host transfer nếu cần
- **Kết quả**: 
  - Game về trạng thái `waiting` (1/2 players)
  - Sẵn sàng cho người chơi mới join
  - Sau khi join đủ 2 người → Chuyển sang `ready` (2/2, chưa bắt đầu)

### 3. History Saving
- **Authenticated**: Lưu vào DB khi game finished + cả 2 rời
- **Guest**: Lưu vào localStorage khi game finished
- **Cleanup**: Tự động xóa games cũ (50 cho authenticated, 20 cho guest)

### 4. Winning Line
- **Tính toán**: Trong `checkWin()`, trả về array các cell
- **Lưu trữ**: Lưu vào `game.winningLine` và `GameHistory.winningLine`
- **Hiển thị**: SVG overlay + cell highlighting

### 5. Real-time Sync
- **Socket Events**: Cập nhật real-time cho tất cả clients
- **Smart Merge**: Chỉ update phần thay đổi
- **Fallback**: Polling 30s nếu socket fail

---

## 🎯 Kết Luận

Mini Game Caro là một hệ thống phức tạp với nhiều edge cases được xử lý cẩn thận:
- ✅ Quản lý host transfer khi player rời
- ✅ Lưu history phân biệt guest và authenticated
- ✅ Real-time updates không flickering
- ✅ Winning line visualization
- ✅ Undo system với approval
- ✅ Block two ends rule
- ✅ Multiple board sizes
- ✅ Game state management chính xác

Tất cả logic đều được xử lý để đảm bảo trải nghiệm người dùng mượt mà và nhất quán.
