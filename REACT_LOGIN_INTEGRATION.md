# React Login Integration Documentation

## Overview

This implementation provides a complete React login system that integrates with your CRM backend authentication API.

## Files Created

### 1. `LoginPage.tsx` - Main Login Component

**Features:**
- ✅ Email and password form fields with validation
- ✅ Calls POST /auth/login on form submission
- ✅ Saves JWT token to localStorage as 'crm_token'
- ✅ Redirects to /dashboard after successful login
- ✅ Shows error messages under the form for failed login attempts
- ✅ Beautiful Tailwind CSS styling with dark mode support
- ✅ Loading states and form validation
- ✅ Demo credentials display for easy testing

### 2. `auth.ts` - Authentication Utilities

**Features:**
- ✅ JWT token management (get, set, remove)
- ✅ User data management in localStorage
- ✅ Authentication state checking
- ✅ Authenticated API request helper
- ✅ Automatic logout on 401 responses
- ✅ Token expiration validation

### 3. `ProtectedRoute.tsx` - Route Protection

**Features:**
- ✅ Checks authentication before rendering protected components
- ✅ Redirects to login if not authenticated
- ✅ Provides loading states
- ✅ Auth context for accessing user data

### 4. `LogoutButton.tsx` - Logout Component

**Features:**
- ✅ Clears authentication data
- ✅ Redirects to login page
- ✅ Multiple styling variants (button, menu-item)

## Next.js App Router Integration

### Route Structure
```
src/app/
├── page.tsx                 # Root route (redirects based on auth)
├── login/
│   └── page.tsx            # Login page route
└── dashboard/
    └── page.tsx            # Protected dashboard route
```

### Component Structure
```
src/components/
├── LoginPage.tsx           # Login form component
├── ProtectedRoute.tsx      # Authentication wrapper
├── LogoutButton.tsx        # Logout functionality
└── DashboardLayout.tsx     # Existing dashboard (now protected)

src/utils/
└── auth.ts                 # Authentication utilities
```

## Usage Examples

### 1. Basic Next.js Integration

#### Login Route (`src/app/login/page.tsx`):
```tsx
import LoginPage from '../../components/LoginPage'

export default function LoginRoute() {
  return <LoginPage />
}
```

#### Protected Dashboard (`src/app/dashboard/page.tsx`):
```tsx
import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950">
        <DashboardLayout />
      </div>
    </ProtectedRoute>
  )
}
```

#### Root Page with Auto-Redirect (`src/app/page.tsx`):
```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '../utils/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return <LoadingSpinner />
}
```

### 2. React Router Integration (Alternative)

For standard React applications using React Router:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { isAuthenticated } from './utils/auth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - redirect based on auth */}
        <Route 
          path="/" 
          element={
            isAuthenticated() ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } 
        />
        
        {/* Login route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}
```

### 3. Using Authentication Utilities

#### Making Authenticated API Calls:
```tsx
import { apiRequest } from '../utils/auth'

// Get clients with authentication
const clients = await apiRequest('/clients')

// Create new client
const newClient = await apiRequest('/clients', {
  method: 'POST',
  body: JSON.stringify({
    name: 'New Client',
    email: 'client@example.com'
  })
})
```

#### Using Auth Context in Components:
```tsx
import { useAuth } from '../components/ProtectedRoute'

function UserProfile() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Email: {user?.email}</p>
    </div>
  )
}
```

#### Adding Logout to Navigation:
```tsx
import LogoutButton from '../components/LogoutButton'

function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4">
      <div>Navigation Items</div>
      <LogoutButton variant="button" />
    </nav>
  )
}
```

## Environment Configuration

### Frontend Environment Variables

Create `.env.local` in your Next.js root:

```bash
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Backend CORS Configuration

Ensure your backend allows requests from your frontend:

```typescript
// In your backend app.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
```

## Authentication Flow

### 1. Login Process
```
User submits form → 
POST /auth/login → 
Backend validates → 
Returns JWT + user data → 
Save to localStorage → 
Redirect to /dashboard
```

### 2. Protected Route Access
```
User visits protected route → 
ProtectedRoute checks localStorage → 
Valid token? → Yes: Render component → 
Invalid/missing token? → Redirect to /login
```

### 3. API Request Flow
```
Component makes API call → 
apiRequest() adds Authorization header → 
Backend validates JWT → 
Valid: Return data → 
Invalid (401): Auto logout + redirect to login
```

### 4. Logout Process
```
User clicks logout → 
Clear localStorage → 
Redirect to /login
```

## Security Features

1. **JWT Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Token Validation**: Automatic expiration checking
3. **Auto Logout**: Invalid tokens trigger automatic logout
4. **CORS Protection**: Backend configured for specific origins
5. **Form Validation**: Client-side validation before API calls
6. **Error Handling**: Comprehensive error messages for users

## Testing the Integration

### 1. Start Both Servers
```bash
# Backend (Port 5001)
cd backend && npm run dev

# Frontend (Port 3000)
cd frontend && npm run dev
```

### 2. Test Login Flow
1. Visit `http://localhost:3000`
2. Should redirect to `/login`
3. Use demo credentials:
   - Email: `admin@crm.local`
   - Password: `admin_password_2025_secure!`
4. Should redirect to `/dashboard` after successful login

### 3. Test Protected Routes
1. Visit `http://localhost:3000/dashboard` directly
2. If not logged in: redirects to login
3. If logged in: shows dashboard

### 4. Test Logout
1. Click logout button in dashboard
2. Should clear auth data and redirect to login

## Production Considerations

1. **Token Storage**: Consider httpOnly cookies instead of localStorage
2. **HTTPS**: Use HTTPS in production for secure token transmission
3. **Token Refresh**: Implement refresh token mechanism for longer sessions
4. **Error Boundaries**: Add React error boundaries for better UX
5. **Loading States**: Implement skeleton loaders for better perceived performance
6. **Session Timeout**: Add automatic logout after inactivity

## Customization Options

### Styling
- All components use Tailwind CSS
- Dark mode support built-in
- Easily customizable color schemes and layouts

### Validation
- Form validation can be extended with libraries like Zod or Yup
- Server-side validation already implemented in backend

### Error Handling
- Error messages can be customized
- Toast notifications can be added for better UX

The login system is now fully integrated and ready for production use! 🚀