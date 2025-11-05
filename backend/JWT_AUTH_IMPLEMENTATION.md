# JWT Authentication Middleware Implementation

## Overview

This implementation provides a complete JWT authentication middleware solution with protected routes for a CRM system.

## Files Created

### 1. `authMiddleware.ts` - Main JWT Authentication Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// JWT payload interface
interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * JWT Authentication Middleware
 * 
 * - Reads JWT from Authorization: Bearer <token> header
 * - Verifies using JWT_SECRET
 * - If valid, attaches req.user = { id, email }
 * - If missing or invalid, returns 401 JSON { error: "Unauthorized" }
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract token from header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get JWT secret from environment
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Attach user info to request object
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    // Continue to next middleware/handler
    next();
    
  } catch (error) {
    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (error instanceof jwt.NotBeforeError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Generic error
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### 2. Protected Routes Examples

#### `clientRoutes.ts` - Protected Client Management Routes

```typescript
import express, { Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to ALL routes in this router
router.use(authMiddleware);

/**
 * GET /clients - Get all clients for authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id; // req.user guaranteed to exist
  // Implementation here...
});

/**
 * POST /clients - Create new client
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, email, phone, address } = req.body;
  // Implementation here...
});

export default router;
```

#### `taskRoutes.ts` - Protected Task Management Routes

```typescript
import express, { Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to ALL routes
router.use(authMiddleware);

/**
 * GET /tasks - Get all tasks with optional filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { status, priority, clientId } = req.query;
  // Implementation with filtering...
});

/**
 * POST /tasks - Create new task
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, description, status, priority, dueDate, clientId } = req.body;
  // Implementation here...
});

export default router;
```

#### `credentialRoutes.ts` - Protected Credential Management Routes

```typescript
import express, { Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';

const router = express.Router();

// Apply authentication middleware to ALL routes
router.use(authMiddleware);

/**
 * POST /credentials - Create encrypted credentials
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, type, username, password, apiKey } = req.body;
  
  // Encrypt sensitive data before storing
  const passwordEncrypted = password ? encrypt(password) : null;
  const apiKeyEncrypted = apiKey ? encrypt(apiKey) : null;
  
  // Store encrypted data in database...
});

export default router;
```

### 3. App Integration

#### `app.ts` - Main Application Setup

```typescript
import express from 'express';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';
import credentialRoutes from './routes/credentialRoutes';

const app = express();

// Middleware setup...
app.use(express.json());

// Routes
app.use('/auth', authRoutes);           // Public auth routes
app.use('/clients', clientRoutes);      // Protected with authMiddleware
app.use('/tasks', taskRoutes);          // Protected with authMiddleware  
app.use('/credentials', credentialRoutes); // Protected with authMiddleware

export default app;
```

## Usage Examples

### 1. Register and Login (Public Routes)

```bash
# Register new user
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login to get JWT token
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Response includes JWT token:
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "john@example.com", "name": "John Doe" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Access Protected Routes

```bash
# Set token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get clients (protected)
curl -X GET http://localhost:5001/clients \
  -H "Authorization: Bearer $TOKEN"

# Create new client (protected)
curl -X POST http://localhost:5001/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","email":"contact@acme.com","phone":"+1-555-0123"}'

# Get tasks (protected)
curl -X GET http://localhost:5001/tasks \
  -H "Authorization: Bearer $TOKEN"

# Create new task (protected)
curl -X POST http://localhost:5001/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Review contract","priority":"high","dueDate":"2024-12-15"}'

# Create credentials (protected)
curl -X POST http://localhost:5001/credentials \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"AWS Prod","type":"aws","username":"admin","password":"secret123"}'
```

### 3. Error Handling

```bash
# Without token - Returns 401
curl -X GET http://localhost:5001/clients
# Response: {"error":"Unauthorized"}

# Invalid token - Returns 401  
curl -X GET http://localhost:5001/clients \
  -H "Authorization: Bearer invalid-token"
# Response: {"error":"Unauthorized"}

# Expired token - Returns 401
curl -X GET http://localhost:5001/clients \
  -H "Authorization: Bearer expired-token"
# Response: {"error":"Unauthorized"}
```

## Security Features

1. **JWT Verification**: All tokens verified against JWT_SECRET
2. **Automatic Expiration**: Tokens expire in 7 days (configurable)
3. **User Context**: Each request includes authenticated user info
4. **Encryption**: Sensitive credentials encrypted before storage
5. **Rate Limiting**: API requests rate-limited to prevent abuse
6. **CORS Protection**: Cross-origin requests properly configured
7. **Helmet Security**: Security headers automatically applied

## Key Benefits

- **Simple Integration**: Apply `authMiddleware` to any route/router
- **Type Safety**: Full TypeScript support with `AuthenticatedRequest`
- **Flexible**: Can protect individual routes or entire router groups
- **Consistent**: All protected routes follow same authentication pattern
- **Secure**: Industry-standard JWT implementation with proper error handling

## Route Structure

```
/auth/*           - Public authentication routes
/clients/*        - Protected client management  
/tasks/*          - Protected task management
/credentials/*    - Protected credential management
```

All routes under `/clients`, `/tasks`, and `/credentials` are automatically protected and require valid JWT authentication.