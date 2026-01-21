# Brainstorm Report: Full Profile Feature Plan

**Date:** 2026-01-22
**Status:** Approved
**Scope:** Authenticated users only (no guest profile)

---

## Problem Statement

Current ProfilePage chỉ hiển thị basic info (username, email) và game stats đơn giản. Cần mở rộng thành full-featured profile với avatar, achievements, rank system, và detailed statistics.

## Constraints

- **Storage:** Free tier deployment → no file upload, use preset avatars + Gravatar
- **Server:** Free tier → no heavy charts, simple stats only
- **Scope:** No guest profile, no social features (Phase 5 deferred)

---

## Final Implementation Plan

### Priority Order: Easy → Hard

| Phase | Feature | Complexity | Estimated Time |
|-------|---------|------------|----------------|
| 1 | Core Profile Enhancement | Easy | 2-3 days |
| 2 | Rank/Level System | Easy | 1-2 days |
| 3 | Detailed Statistics | Medium | 2-3 days |
| 4 | Achievement System | Hard | 4-5 days |

**Total Estimated:** 9-13 days

---

## Phase 1: Core Profile Enhancement (EASY)

### 1.1 Database Changes

**User Model Additions:**
```typescript
// backend/src/models/User.ts
interface IUser {
  // Existing fields...

  // NEW FIELDS
  displayName?: string;        // Optional, max 30 chars
  bio?: string;                // Optional, max 200 chars
  avatar: {
    type: 'preset' | 'gravatar';
    value: string;             // preset ID or gravatar email hash
  };
  settings: {
    language: 'en' | 'vi';
    emailNotifications: boolean;
  };
}

// Default values
avatar: { type: 'preset', value: 'default-1' }
settings: { language: 'en', emailNotifications: true }
```

### 1.2 Preset Avatar System

**Location:** `frontend/public/avatars/`

**Categories (20 avatars total):**
- `animal-1` to `animal-5` (cat, dog, fox, owl, panda)
- `character-1` to `character-5` (ninja, astronaut, pirate, wizard, knight)
- `abstract-1` to `abstract-5` (geometric patterns)
- `gaming-1` to `gaming-5` (game-related icons)
- `default-1` (default gray avatar)

**Implementation:**
```typescript
// frontend/src/constants/avatars.ts
export const PRESET_AVATARS = [
  { id: 'default-1', category: 'default', path: '/avatars/default-1.svg' },
  { id: 'animal-1', category: 'animal', path: '/avatars/animal-1.svg' },
  // ... etc
];
```

### 1.3 Gravatar Integration

```typescript
// frontend/src/utils/gravatar.ts
import md5 from 'md5'; // or crypto-js

export const getGravatarUrl = (email: string, size = 200): string => {
  const hash = md5(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
};

// Check if user has gravatar
export const hasGravatar = async (email: string): Promise<boolean> => {
  try {
    const res = await fetch(getGravatarUrl(email) + '&d=404');
    return res.ok;
  } catch {
    return false;
  }
};
```

### 1.4 API Endpoints

```
GET  /api/users/me/profile     → Full profile data
PUT  /api/users/me/profile     → Update displayName, bio, avatar, settings
PUT  /api/users/me/password    → Change password (existing?)
```

### 1.5 Frontend Components

```
frontend/src/pages/ProfilePage/
├── ProfilePage.tsx              (main container)
├── components/
│   ├── ProfileHeader.tsx        (avatar + name + bio display)
│   ├── ProfileEditModal.tsx     (edit form modal)
│   ├── AvatarSelector.tsx       (preset picker + gravatar option)
│   ├── PasswordChangeForm.tsx   (change password)
│   └── SettingsSection.tsx      (language, notifications)
└── index.ts
```

---

## Phase 2: Rank/Level System (EASY)

### 2.1 Rank Calculation (No DB changes needed)

Use existing `totalScore` from GameStats.

```typescript
// frontend/src/utils/rank.ts
export const RANKS = [
  { name: 'Bronze', min: 0, max: 99, icon: '🥉', color: '#CD7F32' },
  { name: 'Silver', min: 100, max: 299, icon: '🥈', color: '#C0C0C0' },
  { name: 'Gold', min: 300, max: 599, icon: '🥇', color: '#FFD700' },
  { name: 'Platinum', min: 600, max: 999, icon: '💎', color: '#E5E4E2' },
  { name: 'Diamond', min: 1000, max: 1499, icon: '💠', color: '#B9F2FF' },
  { name: 'Master', min: 1500, max: Infinity, icon: '👑', color: '#FF4500' },
] as const;

export const getRank = (totalScore: number) => {
  return RANKS.find(r => totalScore >= r.min && totalScore <= r.max) || RANKS[0];
};

export const getRankProgress = (totalScore: number) => {
  const rank = getRank(totalScore);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  if (!nextRank) return 100; // Max rank

  const progress = ((totalScore - rank.min) / (rank.max - rank.min + 1)) * 100;
  return Math.min(progress, 100);
};
```

### 2.2 Frontend Component

```tsx
// ProfileRankBadge.tsx
<Box>
  <Typography>{rank.icon} {rank.name}</Typography>
  <LinearProgress value={progress} />
  <Typography>{totalScore} / {nextRank?.min || 'MAX'}</Typography>
</Box>
```

---

## Phase 3: Detailed Statistics (MEDIUM)

### 3.1 Database Changes

**GameStats Model Additions:**
```typescript
// backend/src/models/GameStats.ts
interface IGameStats {
  // Existing...

  // NEW FIELDS
  streaks: {
    currentWin: number;
    currentLoss: number;
    bestWin: number;
    bestLoss: number;
  };
  byBoardSize: {
    [size: string]: { wins: number; losses: number; draws: number };
  };
  totalPlayTime: number;      // seconds
  avgGameDuration: number;    // seconds
  lastTenGames: Array<'W' | 'L' | 'D'>;  // Recent form
}
```

### 3.2 Stats Update Logic

Update stats on game finish (in existing game finish handler):

```typescript
// backend/src/services/gameStatsService.ts
async function updateDetailedStats(userId, gameResult, gameDuration, boardSize) {
  const stats = await GameStats.findOne({ userId, gameId: 'caro' });

  // Update streaks
  if (gameResult === 'win') {
    stats.streaks.currentWin++;
    stats.streaks.currentLoss = 0;
    stats.streaks.bestWin = Math.max(stats.streaks.bestWin, stats.streaks.currentWin);
  } else if (gameResult === 'loss') {
    stats.streaks.currentLoss++;
    stats.streaks.currentWin = 0;
    stats.streaks.bestLoss = Math.max(stats.streaks.bestLoss, stats.streaks.currentLoss);
  } else {
    stats.streaks.currentWin = 0;
    stats.streaks.currentLoss = 0;
  }

  // Update board size stats
  const sizeKey = `size_${boardSize}`;
  if (!stats.byBoardSize[sizeKey]) {
    stats.byBoardSize[sizeKey] = { wins: 0, losses: 0, draws: 0 };
  }
  stats.byBoardSize[sizeKey][gameResult === 'win' ? 'wins' : gameResult === 'loss' ? 'losses' : 'draws']++;

  // Update time stats
  stats.totalPlayTime += gameDuration;
  const totalGames = stats.wins + stats.losses + stats.draws;
  stats.avgGameDuration = stats.totalPlayTime / totalGames;

  // Update last 10 games
  stats.lastTenGames.push(gameResult === 'win' ? 'W' : gameResult === 'loss' ? 'L' : 'D');
  if (stats.lastTenGames.length > 10) stats.lastTenGames.shift();

  await stats.save();
}
```

### 3.3 Frontend Display

```tsx
// ProfileDetailedStats.tsx
<Grid container spacing={2}>
  {/* Win Rate */}
  <StatCard label="Win Rate" value={`${winRate}%`} />

  {/* Streaks */}
  <StatCard label="Current Streak" value={streaks.currentWin > 0 ? `🔥 ${streaks.currentWin}W` : `${streaks.currentLoss}L`} />
  <StatCard label="Best Win Streak" value={`🏆 ${streaks.bestWin}`} />

  {/* Recent Form */}
  <Box>
    <Typography>Last 10 Games:</Typography>
    {lastTenGames.map((r, i) => (
      <Chip key={i} label={r} color={r === 'W' ? 'success' : r === 'L' ? 'error' : 'default'} />
    ))}
  </Box>

  {/* By Board Size */}
  <Typography>Stats by Board Size:</Typography>
  {Object.entries(byBoardSize).map(([size, stats]) => (
    <Box key={size}>
      <Typography>{size.replace('size_', '')}x{size.replace('size_', '')}</Typography>
      <Typography>W: {stats.wins} L: {stats.losses} D: {stats.draws}</Typography>
    </Box>
  ))}
</Grid>
```

---

## Phase 4: Achievement System (HARD)

### 4.1 Database Models

**Achievement Definition (Static - can be in code or DB):**
```typescript
// backend/src/constants/achievements.ts
export const ACHIEVEMENTS = [
  // WINS
  { id: 'first-blood', name: { en: 'First Blood', vi: 'Máu Đầu' },
    desc: { en: 'Win your first game', vi: 'Thắng ván đầu tiên' },
    icon: '🩸', category: 'wins', requirement: { type: 'wins', value: 1 }, rarity: 'common' },
  { id: 'warrior', name: { en: 'Warrior', vi: 'Chiến Binh' },
    desc: { en: 'Win 10 games', vi: 'Thắng 10 ván' },
    icon: '⚔️', category: 'wins', requirement: { type: 'wins', value: 10 }, rarity: 'common' },
  { id: 'champion', name: { en: 'Champion', vi: 'Nhà Vô Địch' },
    desc: { en: 'Win 50 games', vi: 'Thắng 50 ván' },
    icon: '🏆', category: 'wins', requirement: { type: 'wins', value: 50 }, rarity: 'rare' },
  { id: 'legend', name: { en: 'Legend', vi: 'Huyền Thoại' },
    desc: { en: 'Win 100 games', vi: 'Thắng 100 ván' },
    icon: '👑', category: 'wins', requirement: { type: 'wins', value: 100 }, rarity: 'epic' },

  // STREAKS
  { id: 'on-fire', name: { en: 'On Fire', vi: 'Cháy Hết Mình' },
    desc: { en: '3 win streak', vi: 'Chuỗi 3 trận thắng' },
    icon: '🔥', category: 'streaks', requirement: { type: 'win_streak', value: 3 }, rarity: 'common' },
  { id: 'unstoppable', name: { en: 'Unstoppable', vi: 'Không Thể Ngăn Cản' },
    desc: { en: '5 win streak', vi: 'Chuỗi 5 trận thắng' },
    icon: '💪', category: 'streaks', requirement: { type: 'win_streak', value: 5 }, rarity: 'rare' },
  { id: 'godlike', name: { en: 'Godlike', vi: 'Thần Thánh' },
    desc: { en: '10 win streak', vi: 'Chuỗi 10 trận thắng' },
    icon: '⚡', category: 'streaks', requirement: { type: 'win_streak', value: 10 }, rarity: 'legendary' },

  // GAMES PLAYED
  { id: 'newcomer', name: { en: 'Newcomer', vi: 'Người Mới' },
    desc: { en: 'Play your first game', vi: 'Chơi ván đầu tiên' },
    icon: '🎮', category: 'games', requirement: { type: 'games_played', value: 1 }, rarity: 'common' },
  { id: 'regular', name: { en: 'Regular', vi: 'Thường Xuyên' },
    desc: { en: 'Play 50 games', vi: 'Chơi 50 ván' },
    icon: '🎯', category: 'games', requirement: { type: 'games_played', value: 50 }, rarity: 'rare' },
  { id: 'veteran', name: { en: 'Veteran', vi: 'Cựu Binh' },
    desc: { en: 'Play 200 games', vi: 'Chơi 200 ván' },
    icon: '🎖️', category: 'games', requirement: { type: 'games_played', value: 200 }, rarity: 'epic' },

  // SPECIAL
  { id: 'night-owl', name: { en: 'Night Owl', vi: 'Cú Đêm' },
    desc: { en: 'Win a game after midnight', vi: 'Thắng sau 12 giờ đêm' },
    icon: '🦉', category: 'special', requirement: { type: 'night_win', value: 1 }, rarity: 'rare' },
  { id: 'perfectionist', name: { en: 'Perfectionist', vi: 'Hoàn Hảo' },
    desc: { en: 'Win 5 games in a row without losing', vi: 'Thắng 5 ván liên tiếp không thua' },
    icon: '💯', category: 'special', requirement: { type: 'perfect_streak', value: 5 }, rarity: 'epic' },
  { id: 'comeback-king', name: { en: 'Comeback King', vi: 'Vua Lội Ngược' },
    desc: { en: 'Win after being down 0-2 in score', vi: 'Thắng sau khi thua 0-2' },
    icon: '👊', category: 'special', requirement: { type: 'comeback', value: 1 }, rarity: 'rare' },
] as const;

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};
```

**User Achievement Model:**
```typescript
// backend/src/models/UserAchievement.ts
interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: string;
  unlockedAt: Date;
}

const UserAchievementSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
});

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
```

### 4.2 Achievement Check Service

```typescript
// backend/src/services/achievementService.ts
import { ACHIEVEMENTS } from '../constants/achievements';
import UserAchievement from '../models/UserAchievement';

export async function checkAndAwardAchievements(
  userId: string,
  stats: IGameStats,
  gameContext?: { isNightGame?: boolean; wasComeback?: boolean }
): Promise<string[]> {
  const existing = await UserAchievement.find({ userId }).select('achievementId');
  const existingIds = new Set(existing.map(a => a.achievementId));

  const newlyUnlocked: string[] = [];
  const totalGames = stats.wins + stats.losses + stats.draws;

  for (const achievement of ACHIEVEMENTS) {
    if (existingIds.has(achievement.id)) continue;

    let qualified = false;

    switch (achievement.requirement.type) {
      case 'wins':
        qualified = stats.wins >= achievement.requirement.value;
        break;
      case 'games_played':
        qualified = totalGames >= achievement.requirement.value;
        break;
      case 'win_streak':
        qualified = stats.streaks.bestWin >= achievement.requirement.value;
        break;
      case 'night_win':
        qualified = gameContext?.isNightGame === true;
        break;
      case 'comeback':
        qualified = gameContext?.wasComeback === true;
        break;
      // Add more cases...
    }

    if (qualified) {
      await UserAchievement.create({ userId, achievementId: achievement.id });
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
}
```

### 4.3 Achievement Notification (Frontend)

```typescript
// frontend/src/contexts/AchievementContext.tsx
const AchievementProvider = ({ children }) => {
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const showAchievementToast = (achievementId: string) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    // Using MUI Snackbar or react-toastify
    toast(
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography fontSize="2rem">{achievement.icon}</Typography>
        <Box>
          <Typography fontWeight="bold">Achievement Unlocked!</Typography>
          <Typography>{achievement.name[language]}</Typography>
        </Box>
      </Box>,
      { autoClose: 5000 }
    );
  };

  return (
    <AchievementContext.Provider value={{ showAchievementToast }}>
      {children}
    </AchievementContext.Provider>
  );
};
```

### 4.4 Socket Event for Achievement Notification

```typescript
// Backend: Emit after game finish
socket.emit('achievement-unlocked', { achievementIds: newlyUnlocked });

// Frontend: Listen
socket.on('achievement-unlocked', ({ achievementIds }) => {
  achievementIds.forEach(id => showAchievementToast(id));
});
```

---

## File Structure Summary

```
frontend/src/
├── pages/
│   └── ProfilePage/
│       ├── ProfilePage.tsx
│       ├── components/
│       │   ├── ProfileHeader.tsx
│       │   ├── ProfileEditModal.tsx
│       │   ├── AvatarSelector.tsx
│       │   ├── ProfileRankBadge.tsx
│       │   ├── ProfileDetailedStats.tsx
│       │   ├── ProfileAchievements.tsx
│       │   ├── PasswordChangeForm.tsx
│       │   └── SettingsSection.tsx
│       └── index.ts
├── components/
│   └── AvatarDisplay/
│       └── AvatarDisplay.tsx
├── contexts/
│   └── AchievementContext.tsx
├── constants/
│   ├── avatars.ts
│   ├── achievements.ts
│   └── ranks.ts
├── utils/
│   ├── gravatar.ts
│   └── rank.ts
└── types/
    └── profile.types.ts

backend/src/
├── models/
│   ├── User.ts (updated)
│   ├── GameStats.ts (updated)
│   └── UserAchievement.ts (new)
├── constants/
│   └── achievements.ts
├── services/
│   └── achievementService.ts (new)
├── controllers/
│   └── userController.ts (add profile methods)
└── routes/
    └── userRoutes.ts (add endpoints)
```

---

## API Summary

| Method | Endpoint | Phase | Description |
|--------|----------|-------|-------------|
| GET | `/api/users/me/profile` | 1 | Get full profile |
| PUT | `/api/users/me/profile` | 1 | Update profile |
| PUT | `/api/users/me/password` | 1 | Change password |
| GET | `/api/users/me/stats/detailed` | 3 | Detailed stats |
| GET | `/api/users/me/achievements` | 4 | User achievements |
| GET | `/api/achievements` | 4 | All achievements list |

---

## Success Metrics

- [ ] User can select preset avatar or use Gravatar
- [ ] User can edit displayName and bio
- [ ] User can change password
- [ ] Rank badge displays correctly based on totalScore
- [ ] Detailed stats show streaks, board size breakdown
- [ ] Achievements unlock and show toast notification
- [ ] All text supports EN/VI

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Avatar SVGs too large | Slow load | Optimize SVGs, use 48x48 or 64x64 max |
| Achievement check slow | Game finish delay | Run async, don't block response |
| Stats migration for existing users | Data inconsistency | Initialize defaults on first profile load |
| Toast spam on multiple achievements | UX annoyance | Queue toasts, max 3 at a time |

---

## Next Steps

1. **Create avatar SVG files** (20 presets)
2. **Update User model** (backend)
3. **Create profile API endpoints** (backend)
4. **Build ProfilePage components** (frontend)
5. **Implement rank calculation** (frontend only)
6. **Update GameStats model** (backend)
7. **Build detailed stats display** (frontend)
8. **Create achievement system** (backend + frontend)
9. **Add socket events for achievement notifications**

---

## Unresolved Questions

None - all requirements clarified.

---

*Report generated: 2026-01-22*
