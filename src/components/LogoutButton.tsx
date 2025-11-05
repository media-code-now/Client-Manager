'use client'

import { useRouter } from 'next/navigation'
import { logout } from '../utils/auth'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface LogoutButtonProps {
  className?: string;
  variant?: 'button' | 'menu-item';
}

export default function LogoutButton({ 
  className = '', 
  variant = 'button' 
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = () => {
    // Clear authentication data
    logout()
    
    // Redirect to login page
    router.push('/login')
  }

  if (variant === 'menu-item') {
    return (
      <button
        onClick={handleLogout}
        className={`flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-200 ${className}`}
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
        Sign Out
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 ${className}`}
    >
      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 -ml-1" />
      Sign Out
    </button>
  )
}