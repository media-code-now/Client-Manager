# CRM Auth Backend

A secure Node.js + Express authentication module for the CRM system using PostgreSQL, TypeScript, bcrypt, and JWT.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup
```bash
# Make sure PostgreSQL is running
brew services start postgresql@14

# Connect to your database and create the auth_users table
export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
psql -d mini_crm -f database/auth_users.sql
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📋 API Endpoints

### Authentication Routes

#### POST /auth/register
Register a new user

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "is_active": true,
    "created_at": "2025-11-04T10:00:00.000Z",
    "updated_at": "2025-11-04T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login
Login user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "is_active": true,
    "created_at": "2025-11-04T10:00:00.000Z",
    "updated_at": "2025-11-04T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/verify
Verify JWT token

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "is_active": true,
    "created_at": "2025-11-04T10:00:00.000Z",
    "updated_at": "2025-11-04T10:00:00.000Z"
  }
}
```

#### GET /auth/me
Get current user info

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "User info retrieved successfully",
  "user": {
    "id": 1,
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "is_active": true,
    "created_at": "2025-11-04T10:00:00.000Z",
    "updated_at": "2025-11-04T10:00:00.000Z"
  }
}
```

### Health Check

#### GET /health
Check server status

**Response:**
```json
{
  "success": true,
  "message": "CRM Auth API is running",
  "timestamp": "2025-11-04T10:00:00.000Z",
  "environment": "development"
}
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express
- **SQL Injection Protection**: Parameterized queries

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # PostgreSQL connection
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   └── auth.ts              # Authentication routes
│   ├── services/
│   │   └── userService.ts       # User database operations
│   ├── types/
│   │   └── auth.ts              # TypeScript interfaces
│   ├── utils/
│   │   └── authUtils.ts         # Authentication utilities
│   └── app.ts                   # Express application
├── database/
│   └── auth_users.sql           # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧪 Testing with cURL

### Register a new user:
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Get user info (replace TOKEN with actual JWT):
```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `mini_crm` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3001` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` (min 32 characters)
3. Configure secure database credentials
4. Enable HTTPS in production
5. Set appropriate CORS origins
6. Configure reverse proxy (nginx)
7. Use PM2 or similar for process management

## 📦 Integration with Frontend

```typescript
// Frontend integration example
const API_BASE_URL = 'http://localhost:5000';

// Register
const register = async (userData: RegisterRequest) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Login
const login = async (credentials: LoginRequest) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};

// Authenticated requests
const getUser = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```