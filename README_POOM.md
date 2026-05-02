# Work Outcome — README_POOM

> **Authentication note:** No cookies are used. Firebase handles all authentication. The Firebase ID token is automatically attached as a `Bearer` header on every API request via an Axios request interceptor. The backend verifies it using Firebase Admin SDK (`admin.auth().verifyIdToken`).

---

## Frontend

### Config

| File | Purpose |
|---|---|
| `app/config/firebase.ts` | Firebase client SDK initialisation — exports `auth` (used by all auth operations) |

### Auth

| File | Purpose |
|---|---|
| `app/auth/auth-middleware.tsx` | `AuthProvider` context + `useAuth()` hook — listens to `onAuthStateChanged` to load current user |
| `app/auth/guard.tsx` | `<Guard allow={[roles]}>` — redirects to correct home page if role not allowed |
| `app/auth/login.tsx` | Login page — Firebase `signInWithEmailAndPassword` |
| `app/auth/register.tsx` | Register page — Firebase account creation + complete profile step |
| `app/auth/forgot-password.tsx` | Forgot password page — Firebase `sendPasswordResetEmail` |

### Layouts

| File | Purpose |
|---|---|
| `app/routes/member-layout.tsx` | Layout wrapper — Guard allows `member` only |
| `app/routes/staff-layout.tsx` | Layout wrapper — Guard allows `staff` only |
| `app/routes/admin-layout.tsx` | Layout wrapper — Guard allows `admin` only |
| `app/routes/auth-layout.tsx` | Layout wrapper for auth pages (no guard) |

### Pages / Components

| File | Purpose |
|---|---|
| `app/component/app-navbar.tsx` | Top navigation bar — role-based links, notification bell, profile icon |
| `app/facility/facility-list.tsx` | Facility list page — fetch from API, filter, admin CRUD buttons |
| `app/facility/facility-card.tsx` | Facility card component — availability, slots, modals |
| `app/admin/admin-page.tsx` | Admin entry page — renders `FacilityList` in admin mode |
| `app/admin/create-facility.tsx` | Create / Edit facility form — image upload (imgbb), opening hours, slot times |
| `app/admin/open-hours-facility.tsx` | Sub-form component for managing opening hours |
| `app/admin/slot-time-facility.tsx` | Sub-form component for managing slot times |
| `app/nofication/notification.tsx` | Notification bell dropdown — fetch, mark read, mark all read |
| `app/profile/profile.tsx` | Profile page — view/edit personal info, change password modal |
| `app/staff-management/staff-mangement.tsx` | Staff list page — create / edit / delete / suspend staff |
| `app/staff-management/create-staff.tsx` | Create / Edit staff form — multi-facility assignment |

### Services (Frontend)

All services talk to the backend API or external APIs.

| File | Purpose |
|---|---|
| `app/services/http.ts` | Axios instance — base URL config, Firebase token interceptor, error normaliser |
| `app/services/types.ts` | Shared TypeScript types for all request/response shapes |
| `app/services/auth.service.ts` | Firebase login, logout, register, changePassword, syncUser |
| `app/services/facility.service.ts` | Get facility cards, create, update, delete, upload image to imgbb |
| `app/services/notification.service.ts` | Get notifications, mark read, mark all read |
| `app/services/profile.service.ts` | Get profile, update profile, update password |
| `app/services/staff-management.service.ts` | Get all staff, create, update, delete, update status |

---

## Backend

### Config

| File | Purpose |
|---|---|
| `src/config/firebase.js` | Firebase Admin SDK init — exports `auth` for `verifyIdToken` |
| `src/config/db.js` | PostgreSQL pool + `initDb()` — creates / migrates all tables on startup |

### Middleware

| File | Purpose |
|---|---|
| `src/middlewares/auth.middleware.js` | `requireAuth` — verify Firebase token, load DB user into `req.user`; `requireRole` — check role |

### Store

| File | Purpose |
|---|---|
| `src/store/user.store.js` | Raw DB queries for users — `findById`, `findByEmail`, `create`, `updateProfileById` |

### Controllers

| File | Purpose |
|---|---|
| `src/controllers/auth.controller.js` | Auth handlers — `syncUser` (Firebase → DB user), `completeRegisterDetails`, `me`, `sessionStatus` |
| `src/controllers/facility.controller.js` | Facility CRUD handlers |
| `src/controllers/notification.controller.js` | Notification fetch and mark-read handlers |
| `src/controllers/profile.controller.js` | `getProfile`, `updateProfile` handlers |
| `src/controllers/staff-management.controller.js` | Staff CRUD + status handlers |

### Services (Backend)

| File | Purpose |
|---|---|
| `src/services/auth.service.js` | `completeRegisterDetails`, `getSessionStatus` |
| `src/services/facility.service.js` | `getFacilityCards`, `createFacility`, `updateFacility`, `deleteFacility` |
| `src/services/notifcation.service.js` | `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` |
| `src/services/profile.service.js` | `getProfile`, `updateProfile` |
| `src/services/staff-management.service.js` | `getAllStaff`, `createStaff`, `updateStaff`, `deleteStaff`, `updateStaffStatus` |

---

## API

### Auth — `/api/auth`

| Method | URL | Permission | Effect |
|---|---|---|---|
| POST | `/auth/register/details` | Auth | Save firstName, lastName, dateOfBirth, address after Firebase account creation |
| GET | `/auth/me` | Auth | Return current user from `req.user` |

### Facilities — `/api/facilities`

| Method | URL | Permission | Effect |
|---|---|---|---|
| GET | `/facilities/cards` | Auth | Return all facilities with today's schedule, slots, and image URL |
| POST | `/facilities` | Auth (Admin) | Create facility with schedules, slot times, image URL |
| PUT | `/facilities/:facilityId` | Auth (Admin) | Update facility details, schedules, slot times, image URL |
| DELETE | `/facilities/:facilityId` | Auth (Admin) | Delete facility (cascade) |

### Profile — `/api/profile`

| Method | URL | Permission | Effect |
|---|---|---|---|
| GET | `/profile` | Auth | Return current user's profile |
| PUT | `/profile` | Auth | Update firstName, lastName, dateOfBirth, address |

### Notifications — `/api/notifications`

| Method | URL | Permission | Effect |
|---|---|---|---|
| GET | `/notifications` | Auth | Return all notifications for current user |
| POST | `/notifications/:notifId/read` | Auth | Mark single notification as read |
| POST | `/notifications/read-all` | Auth | Mark all notifications as read |

### Staff Management — `/api/staff-management`

| Method | URL | Permission | Effect |
|---|---|---|---|
| GET | `/staff-management` | Auth (Admin) | List all staff with assigned facilities |
| POST | `/staff-management` | Auth (Admin) | Create staff user and assign facilities |
| PUT | `/staff-management/:staffId` | Auth (Admin) | Update staff info and facility assignments |
| DELETE | `/staff-management/:staffId` | Auth (Admin) | Delete staff record |
| PATCH | `/staff-management/:staffId/status` | Auth (Admin) | Suspend or reactivate staff account |

### External

| Service | Method | URL | Purpose |
|---|---|---|---|
| imgbb | POST | `https://api.imgbb.com/1/upload?key=API_KEY` | Upload facility image, receive hosted URL stored in DB |
