/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Apple Design Tokens - Color Palette
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // Apple Primary Colors (iOS 26)
        apple: {
          // Primary Blue - System Blue
          blue: {
            50: '#F0F4FF',
            100: '#E0E9FF',
            200: '#C7D9FF',
            300: '#A8C5FF',
            400: '#7FA3FF',
            500: '#5B7FFF', // Primary
            600: '#4A6AFF',
            700: '#3654E8',
            800: '#2A40D0',
            900: '#1E2EA6',
          },
          
          // Accent Colors
          green: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#4ADE80',
            500: '#22C55E', // Success
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#145231',
          },
          
          red: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444', // Error
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
          },
          
          yellow: {
            50: '#FEFCE8',
            100: '#FEF9C3',
            200: '#FEF08A',
            300: '#FDE047',
            400: '#FACC15',
            500: '#EAB308', // Warning
            600: '#CA8A04',
            700: '#A16207',
            800: '#854D0E',
            900: '#713F12',
          },
          
          // Neutral - Slate (for backgrounds)
          slate: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          },
          
          // Purple - Secondary accent
          purple: {
            50: '#FAF5FF',
            100: '#F3E8FF',
            200: '#E9D5FF',
            300: '#D8B4FE',
            400: '#C084FC',
            500: '#A855F7',
            600: '#9333EA',
            700: '#7E22CE',
            800: '#6B21A8',
            900: '#581C87',
          },
          
          // Orange - Tertiary accent
          orange: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
          },
          
          // Pink - Accent
          pink: {
            50: '#FDF2F8',
            100: '#FCE7F3',
            200: '#FBCFE8',
            300: '#F8B4D8',
            400: '#F472B6',
            500: '#EC4899',
            600: '#DB2777',
            700: '#BE185D',
            800: '#9D174D',
            900: '#831843',
          },
        },
      },

      // Apple Typography - Font Sizes with line heights
      fontSize: {
        // Display styles
        'display-lg': ['48px', { lineHeight: '56px', fontWeight: '700' }],
        'display-md': ['40px', { lineHeight: '48px', fontWeight: '700' }],
        'display-sm': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        
        // Heading styles
        'heading-xl': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'heading-lg': ['24px', { lineHeight: '30px', fontWeight: '700' }],
        'heading-md': ['20px', { lineHeight: '26px', fontWeight: '600' }],
        'heading-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        
        // Body text
        'body-lg': ['17px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        
        // Small text
        'caption-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'caption-md': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },

      // Apple Shadows - Glass morphism and depth
      boxShadow: {
        // Glassmorphism shadows
        'glass-xs': 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'glass-sm': 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'glass-md': 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.5), 0 8px 16px rgba(0, 0, 0, 0.12)',
        'glass-lg': 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.5), 0 16px 32px rgba(0, 0, 0, 0.15)',
        'glass-xl': 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.5), 0 24px 48px rgba(0, 0, 0, 0.18)',
        'glass-2xl': 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.5), 0 32px 64px rgba(0, 0, 0, 0.20)',
        
        // Light shadows (default)
        'light-none': '0 0px 0px rgba(0, 0, 0, 0)',
        'light-xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'light-sm': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'light-md': '0 4px 8px rgba(0, 0, 0, 0.10)',
        'light-lg': '0 8px 16px rgba(0, 0, 0, 0.12)',
        'light-xl': '0 12px 24px rgba(0, 0, 0, 0.15)',
        'light-2xl': '0 16px 32px rgba(0, 0, 0, 0.18)',
        
        // Elevated shadows (with depth)
        'elevated-xs': '0 1px 4px rgba(0, 0, 0, 0.08)',
        'elevated-sm': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'elevated-md': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'elevated-lg': '0 8px 24px rgba(0, 0, 0, 0.18)',
        'elevated-xl': '0 12px 32px rgba(0, 0, 0, 0.20)',
        'elevated-2xl': '0 16px 40px rgba(0, 0, 0, 0.22)',
        
        // Dark mode shadows
        'dark-xs': '0 1px 2px rgba(0, 0, 0, 0.20)',
        'dark-sm': '0 2px 4px rgba(0, 0, 0, 0.30)',
        'dark-md': '0 4px 8px rgba(0, 0, 0, 0.40)',
        'dark-lg': '0 8px 16px rgba(0, 0, 0, 0.50)',
        'dark-xl': '0 12px 24px rgba(0, 0, 0, 0.60)',
        
        // Interactive shadows (for hover/focus states)
        'interactive-sm': '0 2px 6px rgba(0, 0, 0, 0.10), 0 0 0 0px rgba(59, 130, 246, 0.1)',
        'interactive-md': '0 4px 12px rgba(0, 0, 0, 0.12), 0 0 0 2px rgba(59, 130, 246, 0.2)',
        'interactive-lg': '0 8px 16px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(59, 130, 246, 0.3)',
        
        // Floating shadows (for floating action buttons)
        'float-sm': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'float-md': '0 8px 20px rgba(0, 0, 0, 0.18)',
        'float-lg': '0 12px 28px rgba(0, 0, 0, 0.20)',
        
        // Inset shadows (for depth)
        'inset-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
        'inset-md': 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
        
        // Focus ring shadows (accessibility)
        'focus-ring': '0 0 0 3px rgba(255, 255, 255, 0.8), 0 0 0 5px rgba(59, 130, 246, 0.6)',
        'focus-ring-dark': '0 0 0 3px rgba(30, 30, 30, 0.8), 0 0 0 5px rgba(59, 130, 246, 0.6)',
      },

      // Apple Border Radius - Rounded corners
      borderRadius: {
        'apple-xs': '4px',
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '24px',
        'apple-3xl': '32px',
        'apple-full': '999px',
      },

      // Apple Spacing - Consistent spacing scale
      spacing: {
        'apple-xs': '4px',
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '24px',
        'apple-3xl': '32px',
        'apple-4xl': '40px',
        
        // Safe Area Padding - For notch/dynamic island support
        'safe-top': 'max(var(--safe-area-inset-top, 0px), 1rem)',
        'safe-bottom': 'max(var(--safe-area-inset-bottom, 0px), 1rem)',
        'safe-left': 'max(var(--safe-area-inset-left, 0px), 1rem)',
        'safe-right': 'max(var(--safe-area-inset-right, 0px), 1rem)',
      },

      // Backdrop blur for glassmorphism
      backdropBlur: {
        'apple-sm': '4px',
        'apple-md': '8px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },

      // Color-tinted glassmorphism effects for semantic feedback
      backgroundColor: {
        // Blue (Info/Primary) tinted glass
        'glass-blue-light': 'rgba(59, 130, 246, 0.08)',     // info background
        'glass-blue-lighter': 'rgba(59, 130, 246, 0.04)',   // subtle info
        
        // Green (Success) tinted glass
        'glass-green-light': 'rgba(34, 197, 94, 0.08)',     // success background
        'glass-green-lighter': 'rgba(34, 197, 94, 0.04)',   // subtle success
        
        // Red (Error) tinted glass
        'glass-red-light': 'rgba(239, 68, 68, 0.08)',       // error background
        'glass-red-lighter': 'rgba(239, 68, 68, 0.04)',     // subtle error
        
        // Yellow (Warning) tinted glass
        'glass-yellow-light': 'rgba(234, 179, 8, 0.08)',    // warning background
        'glass-yellow-lighter': 'rgba(234, 179, 8, 0.04)',  // subtle warning
        
        // Purple (Secondary) tinted glass
        'glass-purple-light': 'rgba(168, 85, 247, 0.08)',   // secondary background
        'glass-purple-lighter': 'rgba(168, 85, 247, 0.04)', // subtle secondary
        
        // Orange (Tertiary) tinted glass
        'glass-orange-light': 'rgba(249, 115, 22, 0.08)',   // tertiary background
        'glass-orange-lighter': 'rgba(249, 115, 22, 0.04)', // subtle tertiary
      },

      // Color-tinted border utilities for glass cards
      borderColor: {
        'glass-blue': 'rgba(59, 130, 246, 0.2)',            // blue glass border
        'glass-green': 'rgba(34, 197, 94, 0.2)',            // green glass border
        'glass-red': 'rgba(239, 68, 68, 0.2)',              // red glass border
        'glass-yellow': 'rgba(234, 179, 8, 0.2)',           // yellow glass border
        'glass-purple': 'rgba(168, 85, 247, 0.2)',          // purple glass border
        'glass-orange': 'rgba(249, 115, 22, 0.2)',          // orange glass border
      },

      // Animation and Transitions
      animation: {
        'apple-fade': 'applePageFade 0.3s ease-in-out',
        'apple-slide-up': 'appleSlideUp 0.4s ease-out',
        'apple-scale': 'appleScale 0.3s ease-out',
        'apple-pulse': 'applePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        applePageFade: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        appleSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        appleScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        applePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      // Transition duration
      transitionDuration: {
        'apple-fast': '150ms',
        'apple-normal': '200ms',
        'apple-slow': '300ms',
      },

      // Transition timing function
      transitionTimingFunction: {
        'apple-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'apple-ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'apple-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },

      // Filter effects for dark mode
      filter: {
        'apple-blur-sm': 'blur(4px)',
        'apple-blur-md': 'blur(8px)',
      },

      // Opacity levels
      opacity: {
        'apple-disabled': '0.5',
        'apple-hover': '0.8',
        'apple-active': '0.7',
      },
    },
  },
  plugins: [],
}
