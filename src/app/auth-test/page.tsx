'use client'

import { useState, useEffect } from 'react'
import { getAuthState, logout, AuthState } from '../../utils/auth'
import LogoutButton from '../../components/LogoutButton'

export default function AuthTestPage() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  })

  useEffect(() => {
    const state = getAuthState()
    setAuthState(state)
  }, [])

  const handleRefresh = () => {
    const state = getAuthState()
    setAuthState(state)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
            Authentication Status Test
          </h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Authentication State:
              </h2>
              <div className="mt-2 p-4 bg-slate-100 dark:bg-slate-700 rounded-md">
                <pre className="text-sm text-slate-600 dark:text-slate-400">
                  {JSON.stringify(authState, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh State
              </button>
              
              {authState.isAuthenticated && (
                <LogoutButton />
              )}
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Test Links:
              </h3>
              <div className="space-y-2">
                <div>
                  <a href="/login" className="text-blue-600 hover:underline">
                    Go to Login Page
                  </a>
                </div>
                <div>
                  <a href="/dashboard" className="text-blue-600 hover:underline">
                    Go to Dashboard (Protected)
                  </a>
                </div>
                <div>
                  <a href="/" className="text-blue-600 hover:underline">
                    Go to Home (Auto-redirect)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}