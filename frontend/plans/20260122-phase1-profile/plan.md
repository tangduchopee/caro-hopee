# Phase 1: Core Profile Enhancement

**Date:** 2026-01-22
**Priority:** High
**Status:** In Progress

---

## Overview

Implement core profile features: avatar system (presets + Gravatar), displayName, bio, and profile editing modal.

## Phases

| Phase | Name | Status | Link |
|-------|------|--------|------|
| 1.1 | Backend Model & API | Pending | [phase-01-backend.md](./phase-01-backend.md) |
| 1.2 | Frontend Types & Utils | Pending | [phase-02-frontend-utils.md](./phase-02-frontend-utils.md) |
| 1.3 | Profile Components | Pending | [phase-03-components.md](./phase-03-components.md) |
| 1.4 | i18n & Integration | Pending | [phase-04-integration.md](./phase-04-integration.md) |

## Key Deliverables

- [ ] 12 preset avatars (SVG) + Gravatar support
- [ ] User model with displayName, bio, avatar, settings
- [ ] Profile edit modal with avatar selector
- [ ] Password change functionality
- [ ] EN/VI translations

## File Changes Summary

**Backend:**
- `models/User.ts` - Add new fields
- `controllers/userController.ts` - Add update methods
- `routes/userRoutes.ts` - Add endpoints

**Frontend:**
- `types/user.types.ts` - Update User interface
- `services/api.ts` - Add API methods
- `utils/gravatar.ts` - New utility
- `constants/avatars.ts` - New constants
- `pages/ProfilePage/` - Refactor with components
- `i18n/locales/` - Add translations

## Success Criteria

- User can select preset avatar or Gravatar
- User can edit displayName (max 30 chars) and bio (max 200 chars)
- User can change password
- All text supports EN/VI
