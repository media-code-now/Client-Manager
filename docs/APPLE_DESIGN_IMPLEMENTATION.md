# Apple iOS 26 Design - Implementation Guide

Complete step-by-step guide to implement Apple's design language in your Client Manager app.

## Quick Reference

### Color Palette (Add to tailwind.config.js)

```javascript
colors: {
  // Apple semantic colors
  'system-blue': '#007AFF',
  'system-green': '#34C759',
  'system-red': '#FF3B30',
  'system-orange': '#FF9500',
  'system-yellow': '#FFCC00',
  'system-pink': '#FF2D55',
  'system-purple': '#AF52DE',
  'system-cyan': '#32B4DC',
  
  // Grayscale
  'label': {
    primary: '#000000',
    secondary: '#3C3C43',
    tertiary: '#8E8E93',
    quaternary: '#D1D1D6',
  },
  'bg': {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#FFFFFF',
    elevated: '#FFFFFF',
  },
}
```

### Typography (tailwind.config.js)

```javascript
fontSize: {
  'display-large': ['44px', { lineHeight: '52px', fontWeight: '500' }],
  'display': ['36px', { lineHeight: '44px', fontWeight: '600' }],
  'title-1': ['34px', { lineHeight: '41px', fontWeight: '600' }],
  'title-2': ['24px', { lineHeight: '30px', fontWeight: '600' }],
  'title-3': ['20px', { lineHeight: '26px', fontWeight: '600' }],
  'headline': ['18px', { lineHeight: '24px', fontWeight: '600' }],
  'body': ['17px', { lineHeight: '24px', fontWeight: '400' }],
  'subheadline': ['15px', { lineHeight: '21px', fontWeight: '400' }],
  'caption-1': ['13px', { lineHeight: '18px', fontWeight: '400' }],
  'caption-2': ['11px', { lineHeight: '16px', fontWeight: '500' }],
}
```

### Shadow System (tailwind.config.js)

```javascript
boxShadow: {
  'level-1': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  'level-2': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  'level-3': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  'level-4': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  
  'dark-level-1': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  'dark-level-2': '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
  'dark-level-3': '0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.2)',
  'dark-level-4': '0 20px 25px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.3)',
}
```

## Component Examples

### 1. Apple Card (Glass Morphism)

```tsx
// AppleCard.tsx
export function AppleCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  children,
  glassmorphism = true,
  className = '' 
}) {
  const baseClasses = "rounded-2xl p-6 transition-all duration-300 border";
  
  const glassClasses = "border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:border-white/30 dark:hover:border-white/20";
  
  const solidClasses = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-level-2 dark:shadow-dark-level-2";
  
  return (
    <div className={`${baseClasses} ${glassmorphism ? glassClasses : solidClasses} ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-4 mb-4">
          {Icon && <Icon className="w-8 h-8 text-blue-600" />}
          {title && (
            <div>
              <h3 className="text-title-2 font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {subtitle && (
                <p className="text-subheadline text-slate-600 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
```

### 2. Apple Button System

```tsx
// AppleButton.tsx
interface AppleButtonProps {
  variant?: 'primary' | 'secondary' | 'glass' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className: string }>;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function AppleButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  ...props
}: AppleButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:hover:bg-blue-500',
    secondary: 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700',
    glass: 'border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/[0.05] backdrop-blur-md hover:bg-white/30 dark:hover:bg-white/[0.1] text-slate-900 dark:text-slate-100',
    destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-caption-1',
    md: 'px-6 py-2.5 text-body font-semibold',
    lg: 'px-8 py-3.5 text-headline font-semibold',
  };

  return (
    <button
      className={`
        rounded-full
        inline-flex items-center justify-center gap-2
        ${variants[variant]}
        ${sizes[size]}
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}
```

### 3. Apple Input Field

```tsx
// AppleInput.tsx
interface AppleInputProps {
  icon?: React.ComponentType<{ className: string }>;
  label?: string;
  error?: string;
  glassmorphism?: boolean;
  [key: string]: any;
}

export function AppleInput({
  icon: Icon,
  label,
  error,
  glassmorphism = false,
  className = '',
  ...props
}: AppleInputProps) {
  const baseClasses = "w-full rounded-lg px-4 py-2.5 text-body transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  
  const containerClasses = Icon ? "pl-10" : "";
  
  const inputClasses = glassmorphism
    ? `${baseClasses} border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/[0.05] backdrop-blur-md text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400`
    : `${baseClasses} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500`;

  return (
    <div className="relative">
      {label && (
        <label className="block text-caption-1 font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
        )}
        
        <input
          className={`${inputClasses} ${containerClasses} ${className}`}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-caption-1 text-red-500 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
```

### 4. Apple Navigation Header

```tsx
// AppleHeader.tsx
export function AppleHeader({ 
  title, 
  subtitle, 
  actions 
}: { 
  title: string; 
  subtitle?: string; 
  actions?: React.ReactNode;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div>
          <h1 className="text-title-2 font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-caption-1 text-slate-600 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
```

### 5. Apple Tab Bar (Bottom Navigation)

```tsx
// AppleTabBar.tsx
export function AppleTabBar({ 
  tabs, 
  activeTab, 
  onTabChange 
}: { 
  tabs: Array<{ id: string; label: string; icon: React.ComponentType<{className: string}> }>;
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 flex h-20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-200 group"
            >
              {isActive && (
                <div className="absolute top-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
              
              <Icon className={`w-6 h-6 transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
              }`} />
              
              <span className={`text-caption-2 transition-colors ${
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

### 6. Apple Card List

```tsx
// AppleCardList.tsx
export function AppleCardList({ 
  items, 
  renderItem,
  emptyState 
}: { 
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  emptyState?: React.ReactNode;
}) {
  if (items.length === 0) {
    return emptyState || (
      <div className="text-center py-12">
        <p className="text-subheadline text-slate-500 dark:text-slate-400">
          No items found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id || index}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-4 transition-all duration-200 hover:shadow-level-2 dark:hover:shadow-dark-level-2"
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
```

## Integration Checklist

### Step 1: Update Tailwind Config

- [ ] Add custom colors to theme
- [ ] Add typography sizes
- [ ] Add shadow utilities
- [ ] Add animations
- [ ] Update border radius defaults

### Step 2: Create Component Library

- [ ] AppleCard
- [ ] AppleButton
- [ ] AppleInput
- [ ] AppleHeader
- [ ] AppleTabBar
- [ ] AppleCardList
- [ ] AppleModal
- [ ] AppleSwitch
- [ ] AppleSearch

### Step 3: Update Existing Components

- [ ] Dashboard Header
- [ ] Sidebar Navigation
- [ ] Mobile Bottom Nav
- [ ] Kanban Boards
- [ ] Calendar
- [ ] Task List
- [ ] Client List
- [ ] Modals/Dialogs
- [ ] Forms

### Step 4: Apply Throughout App

- [ ] Buttons
- [ ] Cards
- [ ] Input Fields
- [ ] Navigation
- [ ] Modals
- [ ] Tables
- [ ] Lists
- [ ] Badges
- [ ] Dropdowns

### Step 5: Testing & Polish

- [ ] Dark mode testing
- [ ] Accessibility testing (contrast, focus states)
- [ ] Mobile responsive testing
- [ ] Animation performance
- [ ] Cross-browser testing
- [ ] Device testing (iOS Safari, Android Chrome)

## Dark Mode Strategy

All components must support dark mode with proper contrast:

```tsx
// Always include dark variants:
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

// For borders:
className="border-slate-200 dark:border-slate-700"

// For hover states:
className="hover:bg-slate-100 dark:hover:bg-slate-800"

// For shadows:
className="shadow-level-2 dark:shadow-dark-level-2"
```

## Animation Library

```tsx
// Fade in
className="animate-fade-in"

// Slide up
className="animate-slide-up"

// Bounce subtle
className="animate-bounce-subtle"

// Pulse soft
className="animate-pulse-soft"

// Button press effect
className="active:scale-95 transition-transform duration-150"
```

## Performance Optimizations

1. **Use CSS transforms** instead of width/height changes
2. **Leverage GPU acceleration** with `will-change`
3. **Batch DOM updates** with React batching
4. **Lazy load images** with native `loading="lazy"`
5. **Code split modals** and heavy components
6. **Memoize expensive components** with `React.memo`

## Accessibility Standards

- Contrast ratio: 4.5:1 minimum for normal text
- Touch targets: 44x44px minimum (iOS standard)
- Focus indicators: Always visible
- ARIA labels: For all interactive elements
- Keyboard navigation: Full support

## Next Steps

1. Create the component library in `/src/components/apple/`
2. Update `tailwind.config.js` with design tokens
3. Apply Apple components incrementally
4. Test on real devices
5. Gather user feedback
6. Iterate and refine

---

**Ready to transform your app with Apple design!** 🍎
