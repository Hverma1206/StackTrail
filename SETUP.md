# Quick Start Guide - MongoDB Setup

## Prerequisites
- Node.js (v16 or higher)
- MongoDB installed and running locally OR MongoDB Atlas account

## Setup Instructions

### 1. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string (replace `<password>` with your database password)

### 2. Backend Setup

```bash
cd backend

# Install dependencies (already done)
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env file and update these values:
# - MONGODB_URI (use your MongoDB connection string)
# - JWT_SECRET (generate a random string)
# - JWT_REFRESH_SECRET (generate another random string)
# - GEMINI_API_KEY (your Gemini API key)
```

#### Generate Secure JWT Secrets
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies (already done)
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

### 4. Start the Application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### 5. Test the Setup

1. Open http://localhost:5173
2. Sign up with a new account
3. Login with your credentials
4. Start a scenario

## Environment Variables Reference

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/stacktrail
JWT_SECRET=your_generated_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_generated_refresh_secret_here
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `brew services list` (macOS)
- Check connection string in `.env`
- For Atlas: ensure IP whitelist is configured

### JWT Token Errors
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in backend `.env`
- Clear localStorage in browser if switching between Supabase and MongoDB versions

### CORS Errors
- Verify FRONTEND_URL in backend `.env` matches your frontend URL
- Check that CORS is properly configured in backend/app.js

### API Connection Errors
- Verify VITE_API_URL in frontend `.env` points to correct backend URL
- Ensure backend is running and accessible

## Next Steps

1. Create scenarios and steps in MongoDB
2. Test authentication flow
3. Test scenario gameplay
4. Configure production environment variables for deployment
