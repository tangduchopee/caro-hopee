# Quick Reference: Phase 1 Profile Feature Files

## All Files at a Glance

### FRONTEND - MUST UPDATE

| File | Path | Action | Priority |
|------|------|--------|----------|
| ProfilePage.tsx | `frontend/src/pages/ProfilePage.tsx` | Add ProfileHeader, EditModal, button | HIGH |
| user.types.ts | `frontend/src/types/user.types.ts` | Add displayName, bio, avatar, settings | HIGH |
| api.ts | `frontend/src/services/api.ts` | Add updateMyProfile(), changePassword() | HIGH |
| en.json | `frontend/src/i18n/locales/en.json` | Add profile.* keys | HIGH |
| vi.json | `frontend/src/i18n/locales/vi.json` | Add profile.* keys (vi) | HIGH |

### FRONTEND - CREATE NEW

| File | Path | Purpose |
|------|------|---------|
| ProfileHeader.tsx | `frontend/src/pages/ProfilePage/components/` | Display avatar, displayName, bio |
| ProfileEditModal.tsx | `frontend/src/pages/ProfilePage/components/` | Edit form modal |
| AvatarSelector.tsx | `frontend/src/pages/ProfilePage/components/` | Pick preset avatars |
| SettingsSection.tsx | `frontend/src/pages/ProfilePage/components/` | Language, notifications settings |
| profile.types.ts | `frontend/src/types/` | Profile-specific interfaces |

### FRONTEND - REFERENCE (Don't modify)

- LanguageContext.tsx - Already working i18n system
- AuthContext.tsx - Already working auth system
- GuestNameDialog.tsx - Modal pattern to copy
- PasswordDialog.tsx - Password modal pattern
- guestName.ts - Storage pattern

---

### BACKEND - MUST UPDATE

| File | Path | Action | Priority |
|------|------|--------|----------|
| User.ts (Model) | `backend/src/models/User.ts` | Add displayName, bio, avatar, settings | HIGH |
| userController.ts | `backend/src/controllers/userController.ts` | Add getMyProfile(), updateMyProfile(), changePassword() | HIGH |
| userRoutes.ts | `backend/src/routes/userRoutes.ts` | Add new endpoints | HIGH |

### BACKEND - REFERENCE (Can study)

- authMiddleware.ts - Use for protecting new routes
- authController.ts - Has validation patterns

---

## Key Integration Points

### 1. User Type Update
```typescript
// frontend/src/types/user.types.ts
export interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;        // NEW
  bio?: string;                // NEW
  avatar?: {                   // NEW
    type: 'preset' | 'gravatar';
    value: string;
  };
  settings?: {                 // NEW
    language: 'en' | 'vi';
    emailNotifications: boolean;
  };
  // ... existing fields
}
```

### 2. API Endpoints to Add
```javascript
// frontend/src/services/api.ts - userApi object
export const userApi = {
  // ... existing methods
  updateMyProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/me/profile`, data);
    return response.data;
  },
  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.put(`/users/me/password`, { oldPassword, newPassword });
    return response.data;
  },
};
```

### 3. Backend User Model Fields
```typescript
// backend/src/models/User.ts
displayName: {
  type: String,
  optional: true,
  maxlength: 30,
  trim: true,
},
bio: {
  type: String,
  optional: true,
  maxlength: 200,
  trim: true,
},
avatar: {
  type: {
    type: String,
    enum: ['preset', 'gravatar'],
    default: 'preset',
  },
  value: {
    type: String,
    default: 'default-1',
  },
},
settings: {
  language: {
    type: String,
    enum: ['en', 'vi'],
    default: 'en',
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
},
```

### 4. Backend Controller Methods
```typescript
// backend/src/controllers/userController.ts

// NEW: Get authenticated user's full profile
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Update authenticated user's profile
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, bio, avatar, settings } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { displayName, bio, avatar, settings },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Change password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  // Implementation...
};
```

### 5. i18n Keys to Add

**en.json:**
```json
"profile": {
  "editProfile": "Edit Profile",
  "displayName": "Display Name",
  "bio": "Bio",
  "avatar": "Avatar",
  "settings": "Settings",
  "language": "Language",
  "notifications": "Email Notifications",
  "changePassword": "Change Password",
  "oldPassword": "Old Password",
  "newPassword": "New Password",
  "confirmPassword": "Confirm Password",
  "saveChanges": "Save Changes"
}
```

**vi.json:**
```json
"profile": {
  "editProfile": "Chỉnh sửa Hồ sơ",
  "displayName": "Tên hiển thị",
  "bio": "Tiểu sử",
  "avatar": "Avatar",
  "settings": "Cài đặt",
  "language": "Ngôn ngữ",
  "notifications": "Thông báo qua Email",
  "changePassword": "Đổi mật khẩu",
  "oldPassword": "Mật khẩu cũ",
  "newPassword": "Mật khẩu mới",
  "confirmPassword": "Xác nhận mật khẩu",
  "saveChanges": "Lưu thay đổi"
}
```

---

## Component Structure

```
ProfilePage/
├── ProfilePage.tsx (main page - ADD edit button & modal state)
├── components/
│   ├── ProfileHeader.tsx (NEW - avatar + displayName + bio display)
│   ├── ProfileEditModal.tsx (NEW - edit form modal)
│   ├── AvatarSelector.tsx (NEW - preset avatar picker)
│   ├── SettingsSection.tsx (NEW - language + notifications)
│   ├── PasswordChangeForm.tsx (NEW - change password form)
│   └── index.ts (NEW - export all)
└── index.ts (NEW - export ProfilePage)
```

---

## Testing Checklist

- [ ] User can edit displayName and bio
- [ ] Edited profile persists after refresh
- [ ] Avatar selector shows preset options
- [ ] Gravatar option (Phase 1.5)
- [ ] Settings saved (language, notifications)
- [ ] Password change validation works
- [ ] i18n translations display correctly (EN/VI)
- [ ] Responsive design on mobile
- [ ] Loading states during API calls
- [ ] Error handling and user feedback

---

## File Sizes & Scope

- ProfilePage.tsx: ~10KB (exists, will add ~20KB new components)
- New components: ~15-20KB total
- Backend updates: ~10KB total
- i18n additions: ~2KB (English), ~2KB (Vietnamese)

**Total new code:** ~30-40KB

---

*Quick Reference v1.0 - 2026-01-22*
