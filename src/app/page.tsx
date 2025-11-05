'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '../utils/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check authentication status and redirect accordingly
    if (isAuthenticated()) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}
