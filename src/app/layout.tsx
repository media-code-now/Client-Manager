import './globals.css'
import '../styles/notifications.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '../components/ThemeProvider'
import { HapticProvider } from '@/context/HapticContext'

export const metadata: Metadata = {
  title: 'Client Manager',
  description: 'Professional client management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground transition-colors duration-300">
        <HapticProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </HapticProvider>
      </body>
    </html>
  )
}
