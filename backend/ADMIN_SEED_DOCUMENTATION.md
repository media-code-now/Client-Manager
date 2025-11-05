# Admin User Seed Script Documentation

## Overview

This implementation provides a complete admin user seeding system for the CRM authentication backend. It safely creates an admin user with hashed passwords and prevents duplicate entries.

## Files Created

### 1. `seedAdmin.ts` - Main Seed Script

**Purpose**: Creates an admin user in the `auth_users` table using environment variables.

**Features**:
- ✅ Reads admin credentials from environment variables
- ✅ Hashes password with bcrypt (12 rounds)
- ✅ Prevents duplicate users (checks email uniqueness)
- ✅ Comprehensive error handling and validation
- ✅ Detailed logging with emojis for easy reading
- ✅ Graceful database connection management

### 2. `testAdmin.ts` - Admin Login Verification

**Purpose**: Tests that the admin user can authenticate successfully.

**Features**:
- ✅ Verifies admin user exists in database
- ✅ Tests password authentication with bcrypt
- ✅ Generates and verifies JWT tokens
- ✅ Complete authentication flow testing

### 3. Package.json Scripts Added

```json
{
  "scripts": {
    "seed:admin": "ts-node src/seedAdmin.ts",
    "test:admin": "ts-node src/testAdmin.ts"
  }
}
```

## Environment Variables Required

Add these to your `.env` file:

```bash
# Admin User Configuration (for seeding)
ADMIN_NAME=CRM Administrator
ADMIN_EMAIL=admin@crm.local
ADMIN_PASSWORD=admin_password_2025_secure!
```

### Variable Requirements:

- **ADMIN_NAME**: Full name of the admin user (required)
- **ADMIN_EMAIL**: Must be a valid email format (required, unique)
- **ADMIN_PASSWORD**: Must be at least 8 characters (required)

## Usage Examples

### 1. Create Admin User

```bash
# Set environment variables in .env file first
npm run seed:admin
```

**First Run Output**:
```
🌱 Starting admin user seed process...

✅ Database connected successfully
📧 Admin Email: admin@crm.local
👤 Admin Name: CRM Administrator
🔐 Password Length: 27 characters

🔍 Checking if admin user already exists...
🔐 Hashing admin password...
✅ Password hashed successfully
👤 Creating admin user...
✅ Admin user created successfully!
   ID: 1
   UUID: d57ee22e-c7dc-4bcc-815a-4bda867fc302
   Name: CRM Administrator
   Email: admin@crm.local
   Active: true
   Created: Tue Nov 04 2025 14:32:25 GMT-0800 (Pacific Standard Time)

🎉 Admin seed process completed successfully!
```

**Subsequent Runs (User Exists)**:
```
🌱 Starting admin user seed process...

✅ Database connected successfully
📧 Admin Email: admin@crm.local
👤 Admin Name: CRM Administrator
🔐 Password Length: 27 characters

🔍 Checking if admin user already exists...
✅ Admin user already exists
   ID: 1
   UUID: d57ee22e-c7dc-4bcc-815a-4bda867fc302
   Name: CRM Administrator
   Email: admin@crm.local
   Active: true
   Created: Tue Nov 04 2025 14:32:25 GMT-0800 (Pacific Standard Time)

🎉 Admin seed process completed successfully!
```

### 2. Test Admin Login

```bash
npm run test:admin
```

**Output**:
```
🧪 Testing admin user login...

✅ Database connected successfully
📧 Testing login for: admin@crm.local
✅ Admin user found in database
   ID: 1
   Name: CRM Administrator
   Email: admin@crm.local

🔐 Testing password authentication...
✅ Password authentication successful!

🎫 Generating JWT token...
✅ JWT token generated successfully
   Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔍 Verifying JWT token...
✅ JWT token verified successfully
   User ID: 1
   Email: admin@crm.local

🎉 Admin login test completed successfully!
```

### 3. Login via API

Once the admin user is created, you can authenticate via the API:

```bash
# Login to get JWT token
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm.local",
    "password": "admin_password_2025_secure!"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "uuid": "d57ee22e-c7dc-4bcc-815a-4bda867fc302",
      "name": "CRM Administrator",
      "email": "admin@crm.local",
      "is_active": true,
      "created_at": "2025-11-04T22:32:25.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

## Error Handling

### Missing Environment Variables
```
❌ Error creating admin user: ADMIN_EMAIL environment variable is required
   Please set the required environment variables in your .env file:
   ADMIN_NAME=John Doe
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_PASSWORD=your_secure_password
```

### Invalid Email Format
```
❌ Error creating admin user: ADMIN_EMAIL must be a valid email address
```

### Password Too Short
```
❌ Error creating admin user: ADMIN_PASSWORD must be at least 8 characters long
```

### Database Connection Issues
```
❌ Error creating admin user: Database connection failed
   Database connection failed. Make sure PostgreSQL is running and configured correctly.
```

## Security Features

1. **Password Hashing**: Uses bcrypt with 12 rounds (configurable via `BCRYPT_ROUNDS`)
2. **Duplicate Prevention**: Checks for existing email before creating user
3. **Input Validation**: Validates email format and password length
4. **Environment Variables**: Sensitive data stored in environment, not code
5. **Database Security**: Uses parameterized queries to prevent SQL injection
6. **Connection Management**: Properly closes database connections

## Integration with Existing System

The seed script integrates seamlessly with your existing CRM authentication system:

- **Uses UserService**: Leverages existing `UserService.createUser()` method
- **Uses AuthUtils**: Leverages existing `AuthUtils.hashPassword()` method
- **Database Schema**: Works with existing `auth_users` table structure
- **Environment Config**: Uses existing `.env` configuration pattern

## Development Workflow

1. **Initial Setup**: Run `npm run seed:admin` during development setup
2. **Verification**: Run `npm run test:admin` to verify admin user works
3. **API Testing**: Use admin credentials to test protected endpoints
4. **Production**: Set production admin credentials in production `.env`

## Production Considerations

1. **Secure Password**: Use a strong, unique password for production
2. **Environment Security**: Keep `.env` file secure and never commit to version control
3. **Admin Email**: Use a real email address that administrators can access
4. **Backup**: Ensure admin user credentials are backed up securely
5. **Rotation**: Consider periodic password rotation for security

## Script Characteristics

- **Idempotent**: Safe to run multiple times (won't create duplicates)
- **Verbose**: Detailed logging for troubleshooting
- **Error-Safe**: Comprehensive error handling with helpful messages
- **TypeScript**: Full type safety and modern async/await patterns
- **Database-Safe**: Proper connection management and cleanup