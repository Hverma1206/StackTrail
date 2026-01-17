# Migration from Supabase to MongoDB

## Summary
Successfully migrated StackTrail from Supabase to MongoDB with JWT-based authentication.

## Changes Made

### Backend Changes

1. **New Files Created:**
   - `backend/src/models/User.js` - User model with bcrypt password hashing
   - `backend/src/utils/jwt.js` - JWT token generation and verification utilities
   - `backend/.env.example` - Environment variables template

2. **Updated Files:**
   - `backend/src/controllers/auth.controller.js` - Complete rewrite to use MongoDB and JWT
     - Signup with bcrypt password hashing
     - Login with password verification
     - Token refresh mechanism
     - Password change with current password verification
     - Password reset token generation (email sending TODO)
   
   - `backend/src/middleware/auth.Middleware.js` - Updated to verify JWT tokens instead of Supabase tokens
   
   - `backend/package.json` - Added bcryptjs and jsonwebtoken, removed @supabase/supabase-js

3. **Removed Files:**
   - `backend/src/config/supabase.js`
   - `backend/src/services/decision.service.js` (old Supabase version)
   - `backend/src/services/decision.service.old.js`

### Frontend Changes

1. **Updated Files:**
   - `frontend/src/context/AuthContext.jsx` - Complete rewrite to use backend API instead of Supabase
     - Uses localStorage for token management
     - Integrated with backend auth endpoints
   
   - `frontend/src/lib/api.js` - Replaced fetch with axios
     - Added token interceptor for automatic auth header injection
     - Added response interceptor for automatic token refresh on 401
     - Centralized API client
   
   - `frontend/src/components/ScenarioAnalysis.jsx` - Updated to use new API client
   
   - `frontend/package.json` - Added axios, removed @supabase/supabase-js

2. **Removed Files:**
   - `frontend/src/lib/supabase.js`

### Documentation Changes
- `Readme.md` - Updated tech stack section to reflect MongoDB and JWT authentication

## Environment Variables Required

Add these to your `backend/.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/stacktrail

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_change_in_production
JWT_REFRESH_EXPIRE=30d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

## Authentication Flow

### Before (Supabase):
1. Client calls Supabase SDK directly
2. Supabase handles auth and returns tokens
3. Backend verifies tokens with Supabase API

### After (MongoDB + JWT):
1. Client calls backend API endpoints
2. Backend validates credentials against MongoDB
3. Backend generates and returns JWT tokens
4. Frontend stores tokens in localStorage
5. Axios interceptor adds token to requests
6. Backend middleware verifies JWT tokens

## Token Management

- **Access Token**: 7 days expiry (configurable)
- **Refresh Token**: 30 days expiry (configurable)
- Automatic token refresh on 401 errors via axios interceptor
- Tokens stored in localStorage

## Security Improvements

1. Passwords hashed with bcrypt (10 salt rounds)
2. Password validation (minimum 8 characters)
3. JWT tokens signed with secret keys
4. User password not returned in queries by default
5. Token refresh mechanism implemented

## TODO

1. Implement email service for password reset functionality
2. Consider implementing token blacklisting for logout
3. Add rate limiting for auth endpoints
4. Consider adding refresh token rotation
5. Add MongoDB connection error handling in production

## Testing Checklist

- [ ] Signup new user
- [ ] Login with credentials
- [ ] Logout
- [ ] Access protected routes
- [ ] Token refresh on expiry
- [ ] Password change
- [ ] Request password reset
- [ ] Start scenario (requires auth)
- [ ] Complete scenario flow

## Database Migration

Existing MongoDB models (Scenario, Step, Progress) are already in place and working. 
Only the User model was added for authentication.

If you have existing users in Supabase, you'll need to:
1. Export user data from Supabase
2. Import users to MongoDB (passwords will need to be reset)
3. Or implement a one-time migration script
