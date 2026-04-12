# Login Troubleshooting: "Invalid email or password"

## Problem
You're receiving an "Invalid email or password" error when trying to log in to Client Manager.

## Root Causes

### 1. **Password Hash Incompatibility** (Most Likely)
The sample data in the database uses PostgreSQL's `crypt()` function for password hashing, but the login API uses bcrypt's `compare()` function. These are incompatible.

**Hashing Methods:**
- Sample data: `crypt('password', gen_salt('bf'))` - PostgreSQL bcrypt variant
- Login API: `bcrypt.compare()` - Node.js bcrypt library

**Why it fails:** The password hashes don't match even with correct credentials.

### 2. **User Doesn't Exist**
The email address you're using doesn't exist in the database.

### 3. **Database Not Connected**
The API can't reach the database to verify credentials.

## Solutions

### Solution 1: Use Admin Account (Recommended)

If you've set up an admin user using the seed script, use those credentials:

```bash
# In backend directory, set admin credentials
export ADMIN_NAME="Your Name"
export ADMIN_EMAIL="admin@yourdomain.com"
export ADMIN_PASSWORD="YourSecurePassword123"

# Run seed script
npm run seed:admin
```

Then log in with:
- **Email**: `admin@yourdomain.com`
- **Password**: `YourSecurePassword123`

### Solution 2: Create a New User with Bcrypt Hashing

Run a database script to insert a properly hashed user:

```sql
-- Using pgcrypto with bcrypt (if available)
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'Test User',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  'admin',
  TRUE
);
```

Or use the Node.js script:

```javascript
const bcrypt = require('bcryptjs');

const password = 'password123';
const hashedPassword = bcrypt.hashSync(password, 10);

// Then INSERT into database with hashedPassword
```

### Solution 3: Reset Database and Reseed

If the database is corrupted or has incompatible password hashes:

```bash
# 1. Drop and recreate the database
psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS client_manager;"
psql -U postgres -d postgres -c "CREATE DATABASE client_manager;"

# 2. Run schema setup
psql -U postgres -d client_manager < database/postgresql_mini_crm_schema.sql

# 3. Seed admin user
npm run seed:admin
```

### Solution 4: Check Database Connection

Verify your database is running and accessible:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT * FROM users LIMIT 1;"

# Check if auth_users table exists
psql $DATABASE_URL -c "SELECT * FROM auth_users LIMIT 1;"
```

## Verification Steps

### Step 1: Check User Exists
```bash
# Connect to your database and run:
psql $DATABASE_URL -c "SELECT id, email, name FROM users WHERE email = 'your@email.com';"
```

**Expected output:** One row with your user details

**If no results:** User doesn't exist, create one with Solution 1 or 3

### Step 2: Verify Password Hash
```bash
# Check if password_hash is populated:
psql $DATABASE_URL -c "SELECT email, password_hash FROM users WHERE email = 'your@email.com';"
```

**Expected output:** Email and a long hash starting with `$2a$` or `$2b$` (bcrypt format)

**If NULL or different format:** Password was not hashed correctly

### Step 3: Test Authentication API
```bash
# Use curl to test the login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected response:** 
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "refreshToken": "...",
  "user": { "id": 1, "email": "test@example.com", ... }
}
```

**If error:** Check backend logs for details

## Environment Variables Required

Make sure these are set in `.env` or `.env.local`:

```
# Database
DATABASE_URL=postgresql://user:password@host:5432/client_manager

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Admin Seed (optional, for creating admin user)
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid email or password" | User doesn't exist | Create user with Solution 1 |
| "Invalid email or password" | Password hash incompatible | Reseed with bcrypt hashing |
| "Database connection failed" | DATABASE_URL incorrect | Check .env file |
| "Server configuration error" | JWT secrets missing | Add JWT_SECRET to .env |
| Login works but no token | JWT signing failed | Check JWT_SECRET is set |

## Password Requirements

When creating users, passwords must:
- Be at least 8 characters long
- Be hashed using bcrypt (Node.js library)
- Have a cost factor of 10 (default)

## Test Credentials (After Setup)

After running the seed script, use:
- **Email**: Your ADMIN_EMAIL value
- **Password**: Your ADMIN_PASSWORD value

## Need More Help?

1. Check backend logs: `tail -f logs/app.log`
2. Enable debug mode: `DEBUG=* npm run dev`
3. Test database directly: `psql $DATABASE_URL -c "SELECT version();"`
4. Verify all environment variables are set: `env | grep DATABASE_URL`

## Summary Checklist

- [ ] Database is running and accessible
- [ ] DATABASE_URL environment variable is set
- [ ] User exists in database
- [ ] User has non-null password_hash
- [ ] Password hash is in bcrypt format ($2a$ or $2b$)
- [ ] JWT_SECRET and JWT_REFRESH_SECRET are set
- [ ] Backend API is running on correct port
- [ ] Email and password are correct

Once all items are checked, login should work!
