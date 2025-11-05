import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '../components/ThemeProvider'

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
