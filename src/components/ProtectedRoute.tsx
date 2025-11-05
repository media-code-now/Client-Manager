'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser, User } from '../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  isLoading: true,
});

export function useAuth() {
  return React.useContext(AuthContext);
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        // Not authenticated, redirect to login
        router.push('/login')
        return
      }

      // Get user data
      const userData = getUser()
      setUser(userData)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      )
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

