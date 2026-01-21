# Scout Report: Phase 1 Profile Feature - File Inventory

**Date:** 2026-01-22
**Status:** Complete
**Scope:** All files related to Phase 1 of the profile feature implementation

---

## Executive Summary

This report catalogs all files needed for Phase 1 of the profile feature (Core Profile Enhancement). Includes frontend pages, contexts, types, services, components, i18n files, and backend models/controllers.

**Total Files Identified:** 19 (frontend) + 5 (backend)

---

## Frontend Files

### 1. Pages

#### ProfilePage.tsx
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/pages/ProfilePage.tsx`
**Current Implementation:**
- Displays user basic info (username, email)
- Shows game statistics with tabs for different games
- Displays wins/losses/draws/totalScore for each game
- Loading states with CircularProgress
- Uses `useAuth()` and `useLanguage()` hooks
- Calls `userApi.getMyProfile()` and `userApi.getUserGames()`
- Responsive design with MUI components (Paper, Box, Typography, Tabs)
- File size: ~10.7 KB

**Missing for Phase 1:**
- Avatar display
- displayName and bio fields
- Edit modal
- Settings section
- Profile header component

---

### 2. Types/Interfaces

#### user.types.ts
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/types/user.types.ts`
**Current Implementation:**
```typescript
export interface User {
  _id: string;
  username: string;
  email: string;
  wins: number;
  losses: number;
  draws: number;
  totalScore: number;
  createdAt: string;
  lastLogin: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
```

**Needs for Phase 1:**
- Add optional fields: `displayName`, `bio`, `avatar` (with type and value)
- Add `settings` object with language and emailNotifications

---

### 3. Contexts

#### AuthContext.tsx
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/contexts/AuthContext.tsx`
**Current Implementation:**
- Manages user authentication state
- Provides `login()`, `register()`, `logout()`, `refreshUser()` functions
- Includes token validation every 5 minutes
- Stores token in localStorage
- Handles 401 errors and clears auth on token expiration
- Already integrated with API

**Status for Phase 1:** Ready - No changes needed initially, but will integrate with profile updates later

---

### 4. API Services

#### api.ts
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/services/api.ts`
**Current Implementation:**
- Axios instance with baseURL from constants
- Auth interceptor adds Bearer token to requests
- Has `userApi` object with:
  - `getProfile(userId)` → GET `/users/{userId}/profile`
  - `getUserGames(userId)` → GET `/users/{userId}/games`
  - `getUserGameStats(userId, gameId)` → GET `/users/{userId}/games/{gameId}`
  - `getMyProfile()` → GET `/users/me/profile`
  - `updateProfile(userId, data)` → PUT `/users/{userId}`

**Missing for Phase 1:**
- `updateMyProfile()` endpoint for PUT `/users/me/profile`
- `changePassword()` endpoint for PUT `/users/me/password`

**Code location lines:** 185-206

---

### 5. i18n Files

#### en.json
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/i18n/locales/en.json`
**Current Status:** Contains auth, home, and game translations
**Missing for Phase 1:**
- `profile.editProfile`
- `profile.displayName`
- `profile.bio`
- `profile.avatar`
- `profile.settings`
- `profile.changePassword`
- `profile.language`
- `profile.notifications`
- Plus common modal/button strings

---

#### vi.json
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/i18n/locales/vi.json`
**Current Status:** Vietnamese translations for auth, home, and game
**Missing:** Same as en.json, needs Vietnamese equivalents

---

#### LanguageContext.tsx
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/i18n/LanguageContext.tsx`
**Current Implementation:**
- Manages language state (en/vi)
- Provides `t()` function for translations with interpolation
- Supports dot-notation keys (e.g., `t('profile.title')`)
- Stores language in localStorage
- Auto-detects browser language
- Updates document.documentElement.lang

**Status:** Ready to use for Phase 1

---

### 6. Existing Modal/Dialog Components

#### GuestNameDialog.tsx
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/components/GuestNameDialog/GuestNameDialog.tsx`
**Reference Implementation for ProfileEditModal:**
- Uses MUI Dialog with styled PaperProps
- Gradient background headers
- TextField with validation
- DialogActions with Cancel/Confirm buttons
- Error handling and helper text
- Responsive design

---

#### PasswordDialog.tsx
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/components/PasswordDialog/PasswordDialog.tsx`
**Reference for PasswordChangeForm:**
- Can be adapted for password change modal

---

#### Other Dialogs
- `SetPasswordDialog/SetPasswordDialog.tsx` - Game room password dialog
- `GameControls/dialogs/UndoRequestDialog.tsx` - Request dialog pattern
- `GameControls/dialogs/WinnerModal.tsx` - Modal pattern for winners
- `HistoryModal/HistoryModal.tsx` - Complex modal with tabs

---

## Backend Files

### 1. User Model

#### User.ts
**Location:** `/Users/admin/Downloads/caro-hopee/backend/src/models/User.ts`
**Current Implementation:**
```typescript
interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  // Legacy fields
  wins?: number;
  losses?: number;
  draws?: number;
  totalScore?: number;
  createdAt: Date;
  lastLogin: Date;
}
```

**Schema:**
- username (unique, 3-20 chars)
- email (unique, lowercase)
- password (min 6 chars)
- Legacy fields with defaults
- timestamps (createdAt, lastLogin)

**Missing for Phase 1:**
- displayName (optional, max 30 chars)
- bio (optional, max 200 chars)
- avatar object { type: 'preset' | 'gravatar', value: string }
- settings object { language: 'en' | 'vi', emailNotifications: boolean }

---

### 2. User Controller

#### userController.ts
**Location:** `/Users/admin/Downloads/caro-hopee/backend/src/controllers/userController.ts`
**Current Implementation:**
- `getUserProfile(req, res)` → GET /users/{userId}/profile
  - Returns user without password
  - Includes legacy stats fields
- `getUserGames(req, res)` → GET /users/{userId}/games
  - Populates GameStats with game type info
  - Sorts by lastPlayed descending

**Missing for Phase 1:**
- `getMyProfile()` - Get authenticated user's full profile
- `updateMyProfile()` - Update displayName, bio, avatar, settings
- `changePassword()` - Change user password

---

### 3. Routes

#### userRoutes.ts
**Location:** `/Users/admin/Downloads/caro-hopee/backend/src/routes/userRoutes.ts`
**Current Status:** Exists, likely has GET /users/:userId/profile and GET /users/:userId/games
**Missing for Phase 1:**
- PUT /api/users/me/profile
- PUT /api/users/me/password

---

### 4. Auth Middleware

#### authMiddleware.ts
**Location:** `/Users/admin/Downloads/caro-hopee/backend/src/middleware/authMiddleware.ts`
**Status:** Already implemented for protecting authenticated routes
**Current Use:** Should be applied to profile update endpoints

---

### 5. Auth Controller

#### authController.ts
**Location:** `/Users/admin/Downloads/caro-hopee/backend/src/controllers/authController.ts`
**Status:** Exists for login/register
**Note:** May need password validation logic for change password feature

---

## Supporting Files & Components

### Utilities

#### guestName.ts
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/utils/guestName.ts`
**Note:** Reference for sessionStorage management pattern

#### guestId.ts, guestHistory.ts, roomCode.ts, timeFormat.ts
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/utils/`
**Note:** Reference utilities for storage and formatting

#### logger.ts
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/utils/logger.ts`
**Used by:** ProfilePage for error logging

---

### Constants

#### constants.ts
**Location:** `/Users/admin/Downloads/caro-hopee/frontend/src/utils/constants.ts`
**Note:** Contains API_BASE_URL used in api.ts

---

## Phase 1 File Dependencies Map

```
ProfilePage.tsx
├── useAuth (AuthContext)
├── useLanguage (LanguageContext)
├── user.types.ts (User interface - needs update)
├── api.ts (userApi.getMyProfile, userApi.updateProfile)
└── logger.ts

AuthContext.tsx
├── user.types.ts
├── api.ts (authApi)
└── localStorage token management

api.ts
├── axios
├── user.types.ts (User, AuthResponse)
├── game.types.ts
└── constants.ts (API_BASE_URL)

LanguageContext.tsx
├── i18n/locales/en.json (needs additions)
└── i18n/locales/vi.json (needs additions)

Backend User Model
├── mongoose
└── No dependencies on other models (independent)

Backend User Controller
├── User model
├── GameStats model (for getUserGames)
├── GameType model (for game name lookups)
└── authMiddleware (for protected routes)
```

---

## Data Flow for Phase 1

### User Registration (Existing)
```
LoginPage → AuthContext.register() → authApi.register() → Backend authController 
→ Create User with defaults → Store token → Set user state
```

### Load Profile (New)
```
ProfilePage (useEffect) → userApi.getMyProfile() → Backend getUserProfile() 
→ Query User by ID → Return user data → Display
```

### Edit Profile (New)
```
ProfileEditModal → Form with displayName, bio, avatar, settings 
→ userApi.updateProfile() → Backend updateProfile() 
→ Validate & save → Update state → Show success
```

---

## Summary Table

| Category | File | Status | Notes |
|----------|------|--------|-------|
| **Frontend Pages** | ProfilePage.tsx | Exists | Needs ProfileHeader, EditModal components |
| **Frontend Types** | user.types.ts | Exists | Needs: displayName, bio, avatar, settings fields |
| **Frontend Contexts** | AuthContext.tsx | Ready | No changes needed for Phase 1 |
| **Frontend Services** | api.ts | Ready | Has userApi, needs updateMyProfile endpoint |
| **Frontend i18n** | en.json | Exists | Needs profile-specific translations |
| **Frontend i18n** | vi.json | Exists | Needs profile Vietnamese translations |
| **Frontend i18n** | LanguageContext.tsx | Ready | Works as-is |
| **Frontend Modals** | GuestNameDialog.tsx | Reference | Use pattern for ProfileEditModal |
| **Backend Model** | User.ts | Exists | Needs displayName, bio, avatar, settings |
| **Backend Controller** | userController.ts | Exists | Needs getMyProfile, updateMyProfile, changePassword |
| **Backend Routes** | userRoutes.ts | Exists | Needs new endpoints |
| **Backend Auth** | authMiddleware.ts | Ready | Available for route protection |
| **Backend Auth** | authController.ts | Ready | Has validation patterns |

---

## Next Steps for Implementation

1. **Update User Model** → Add profile fields to IUser interface and schema
2. **Create new API endpoints** → PUT /users/me/profile, PUT /users/me/password
3. **Update user.types.ts** → Add displayName, bio, avatar, settings to User interface
4. **Create ProfileHeader component** → Display avatar, displayName, bio
5. **Create ProfileEditModal component** → Edit form with validation
6. **Create AvatarSelector component** → Choose from preset avatars
7. **Add i18n strings** → en.json and vi.json translations
8. **Update api.ts** → Add updateMyProfile and changePassword functions
9. **Integrate in ProfilePage** → Add edit button, modal state, form submission

---

## Unresolved Questions

- None - all file locations and current implementations identified

---

*Report generated: 2026-01-22*
*Scout Mode: Complete*
