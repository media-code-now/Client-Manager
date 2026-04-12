# Apple Design Tokens - Tailwind Configuration

## 📋 Overview

The `tailwind.config.js` has been enhanced with comprehensive Apple iOS 26 design tokens including colors, typography, shadows, spacing, and animations.

---

## 🎨 Color Tokens

### Apple Blue (Primary)
Primary color for main actions and interactive elements.

```jsx
// Usage
className="text-apple-blue-500 bg-apple-blue-100 border-apple-blue-200"
```

**Palette**:
- `apple-blue-50` - Lightest (backgrounds)
- `apple-blue-100` to `apple-blue-400` - Light variants
- `apple-blue-500` - Primary color
- `apple-blue-600` to `apple-blue-900` - Dark variants

### Success Color (Green)
For confirmations, completed tasks, and positive states.

```jsx
className="text-apple-green-500 bg-apple-green-100"
```

### Error Color (Red)
For destructive actions, errors, and alerts.

```jsx
className="text-apple-red-500 bg-apple-red-100"
```

### Warning Color (Yellow)
For cautions and pending states.

```jsx
className="text-apple-yellow-500 bg-apple-yellow-100"
```

### Neutral Colors (Slate)
For backgrounds, text, borders, and disabled states.

```jsx
className="bg-apple-slate-50 text-apple-slate-900 border-apple-slate-200"
```

### Secondary Colors
- **Purple** (`apple-purple-*`) - Secondary accent
- **Orange** (`apple-orange-*`) - Tertiary accent
- **Pink** (`apple-pink-*`) - Additional accent

---

## 📝 Typography Tokens

### Display Styles
Large headlines for maximum impact.

```jsx
// Display Large (48px, bold)
className="text-display-lg"

// Display Medium (40px, bold)
className="text-display-md"

// Display Small (32px, bold)
className="text-display-sm"
```

### Heading Styles
Section headers and major content dividers.

```jsx
// Heading XL (28px, bold)
className="text-heading-xl"

// Heading Large (24px, bold)
className="text-heading-lg"

// Heading Medium (20px, semi-bold)
className="text-heading-md"

// Heading Small (18px, semi-bold)
className="text-heading-sm"
```

### Body Text
Main content and descriptions.

```jsx
// Body Large (17px, regular) - For important content
className="text-body-lg"

// Body Medium (16px, regular) - Default body text
className="text-body-md"

// Body Small (15px, regular) - Secondary content
className="text-body-sm"
```

### Caption Text
Labels, secondary information, and small details.

```jsx
// Caption Large (14px, medium weight)
className="text-caption-lg"

// Caption Medium (13px, regular)
className="text-caption-md"

// Caption Small (12px, regular)
className="text-caption-sm"
```

### Combined Example
```jsx
<h1 className="text-display-lg text-apple-slate-900 dark:text-apple-slate-50">
  Dashboard
</h1>
<p className="text-body-md text-apple-slate-600 dark:text-apple-slate-400">
  Welcome back to your workspace
</p>
```

---

## 🌑 Shadow Tokens

### Glassmorphism Shadows
For frosted glass effects with backdrop blur.

```jsx
// Small (4-8px blur + subtle inset)
className="shadow-glass-sm"

// Medium (8-16px blur)
className="shadow-glass-md"

// Large (16-32px blur)
className="shadow-glass-lg"

// Extra Large (24-48px blur)
className="shadow-glass-xl"
```

**Best for**: Cards with `backdrop-blur-md` or higher

### Light Shadows (Default)
Subtle, minimal elevation.

```jsx
// Extra Small
className="shadow-light-xs"

// Small (2px elevation)
className="shadow-light-sm"

// Medium (4px elevation)
className="shadow-light-md"

// Large (8px elevation)
className="shadow-light-lg"

// Extra Large (12px elevation)
className="shadow-light-xl"
```

### Elevated Shadows
For prominent cards and containers.

```jsx
// Small elevation
className="shadow-elevated-sm"

// Medium elevation
className="shadow-elevated-md"

// Large elevation
className="shadow-elevated-lg"

// Extra Large elevation
className="shadow-elevated-xl"
```

### Dark Mode Shadows
Stronger shadows optimized for dark backgrounds.

```jsx
className="shadow-dark-sm"  // 30% opacity
className="shadow-dark-md"  // 40% opacity
className="shadow-dark-lg"  // 50% opacity
```

### Complete Example
```jsx
<div className="rounded-apple-2xl border border-white/60 bg-white/70 p-6 shadow-glass-md backdrop-blur-md dark:border-apple-slate-800/60 dark:bg-apple-slate-900/60 dark:shadow-dark-md">
  {/* Content */}
</div>
```

---

## 🔲 Border Radius Tokens

Consistent rounded corners following Apple's design system.

```jsx
className="rounded-apple-xs"   // 4px
className="rounded-apple-sm"   // 8px
className="rounded-apple-md"   // 12px
className="rounded-apple-lg"   // 16px
className="rounded-apple-xl"   // 20px
className="rounded-apple-2xl"  // 24px (most common)
className="rounded-apple-3xl"  // 32px (large cards)
className="rounded-apple-full" // 999px (pills)
```

### Common Patterns
```jsx
// Button style
className="rounded-apple-2xl"

// Card style
className="rounded-apple-2xl"

// Input fields
className="rounded-apple-2xl"

// Modal dialogs
className="rounded-apple-3xl"

// Pill-shaped badges
className="rounded-apple-full"
```

---

## 📏 Spacing Tokens

Apple-aligned spacing scale for consistent layouts.

```jsx
className="p-apple-xs"   // 4px
className="p-apple-sm"   // 8px
className="p-apple-md"   // 12px
className="p-apple-lg"   // 16px
className="p-apple-xl"   // 20px
className="p-apple-2xl"  // 24px
className="p-apple-3xl"  // 32px
className="p-apple-4xl"  // 40px
```

### Margin & Padding Examples
```jsx
// Margin
className="m-apple-md gap-apple-lg"

// Padding
className="px-apple-lg py-apple-md"

// Gap between flex items
className="flex gap-apple-md"

// Complex spacing
className="space-y-apple-lg"
```

---

## 🎭 Backdrop Blur Tokens

For glassmorphism effects.

```jsx
className="backdrop-blur-apple-sm"   // 4px blur
className="backdrop-blur-apple-md"   // 8px blur
className="backdrop-blur-apple-lg"   // 16px blur
className="backdrop-blur-apple-xl"   // 20px blur
```

### Glassmorphic Card Pattern
```jsx
<div className="
  rounded-apple-2xl 
  border border-white/60 
  bg-white/70 
  p-apple-lg 
  backdrop-blur-apple-md
  shadow-glass-md
  dark:border-apple-slate-800/60 
  dark:bg-apple-slate-900/70
">
  {/* Content with frosted glass appearance */}
</div>
```

---

## ✨ Animation Tokens

### Pre-built Animations
```jsx
// Fade in with slide up (page transitions)
className="animate-apple-fade"

// Slide up (modal/popup animations)
className="animate-apple-slide-up"

// Scale in (component appear)
className="animate-apple-scale"

// Pulse (loading states)
className="animate-apple-pulse"
```

### Keyframes Available
- `applePageFade` - Opacity + downward slide
- `appleSlideUp` - Upward entrance
- `appleScale` - Scale from 0.95 to 1.0
- `applePulse` - Gentle pulse effect

---

## ⏱️ Transition Tokens

### Duration Presets
```jsx
className="transition duration-apple-fast"    // 150ms (quick)
className="transition duration-apple-normal"  // 200ms (default)
className="transition duration-apple-slow"    // 300ms (leisurely)
```

### Timing Functions
```jsx
className="transition ease-apple-ease"        // Standard easing
className="transition ease-apple-ease-in"     // Accelerate
className="transition ease-apple-ease-out"    // Decelerate
```

### Complete Example
```jsx
<button className="
  px-apple-lg py-apple-md
  bg-apple-blue-500 
  text-white
  rounded-apple-2xl
  transition 
  duration-apple-normal 
  ease-apple-ease
  hover:bg-apple-blue-600
  active:scale-95
">
  Click me
</button>
```

---

## 🎯 Opacity Tokens

Predefined opacity levels for disabled and interactive states.

```jsx
className="opacity-apple-disabled"  // 0.5 (disabled state)
className="opacity-apple-hover"     // 0.8 (hover state)
className="opacity-apple-active"    // 0.7 (active/pressed state)
```

---

## 📚 Complete Component Examples

### Apple-styled Button
```jsx
<button className="
  px-apple-lg py-apple-md
  bg-apple-blue-500
  text-white
  font-semibold
  rounded-apple-2xl
  shadow-glass-sm
  transition duration-apple-normal ease-apple-ease
  hover:bg-apple-blue-600
  active:scale-95
  dark:bg-apple-blue-600
  dark:hover:bg-apple-blue-700
">
  Primary Action
</button>
```

### Glassmorphic Card
```jsx
<div className="
  rounded-apple-2xl
  border border-white/60
  bg-white/70
  p-apple-lg
  shadow-glass-md
  backdrop-blur-apple-md
  dark:border-apple-slate-800/60
  dark:bg-apple-slate-900/70
  dark:shadow-dark-md
">
  <h2 className="text-heading-md text-apple-slate-900 dark:text-apple-slate-100">
    Card Title
  </h2>
  <p className="text-body-sm text-apple-slate-600 dark:text-apple-slate-400">
    Card description
  </p>
</div>
```

### Input Field
```jsx
<input 
  type="text"
  className="
    w-full
    rounded-apple-2xl
    border border-white/60
    bg-white/80
    px-apple-lg py-apple-md
    shadow-light-sm
    text-apple-slate-900
    placeholder:text-apple-slate-400
    transition duration-apple-fast
    focus:border-apple-blue-300
    focus:outline-none
    focus:ring-2
    focus:ring-apple-blue-200/60
    dark:border-apple-slate-700/60
    dark:bg-apple-slate-900/80
    dark:text-apple-slate-100
    dark:placeholder:text-apple-slate-500
  "
  placeholder="Enter text..."
/>
```

### Status Badge
```jsx
<span className="
  inline-flex
  items-center
  px-apple-md py-apple-sm
  rounded-apple-full
  bg-apple-green-100
  text-apple-green-700
  text-caption-sm
  font-medium
  dark:bg-apple-green-500/20
  dark:text-apple-green-300
">
  ✓ Active
</span>
```

---

## 🌓 Dark Mode Support

All tokens include automatic dark mode variants via the `dark:` prefix.

```jsx
// Automatic dark mode support
className="
  bg-white dark:bg-apple-slate-900
  text-apple-slate-900 dark:text-apple-slate-100
  border-apple-slate-200 dark:border-apple-slate-700
  shadow-light-md dark:shadow-dark-md
"
```

---

## 📖 Token Usage Quick Reference

| Category | Token Type | Usage |
|----------|-----------|-------|
| **Colors** | `apple-[color]-[shade]` | `bg-apple-blue-500`, `text-apple-red-600` |
| **Typography** | `text-[style]` | `text-heading-lg`, `text-body-md` |
| **Shadows** | `shadow-[type]-[size]` | `shadow-glass-md`, `shadow-elevated-lg` |
| **Radius** | `rounded-apple-[size]` | `rounded-apple-2xl`, `rounded-apple-full` |
| **Spacing** | `[property]-apple-[size]` | `px-apple-lg`, `gap-apple-md` |
| **Blur** | `backdrop-blur-apple-[size]` | `backdrop-blur-apple-md` |
| **Animation** | `animate-apple-[name]` | `animate-apple-fade` |
| **Duration** | `duration-apple-[speed]` | `duration-apple-normal` |
| **Easing** | `ease-apple-[type]` | `ease-apple-ease-out` |

---

## 🚀 Benefits

✅ **Consistency** - Unified design language across the app
✅ **Efficiency** - No more custom tailwind classes
✅ **Maintainability** - Easy to update brand colors globally
✅ **Dark Mode** - Built-in dark mode support
✅ **Accessibility** - WCAG AA color contrast ratios
✅ **Apple-aligned** - Follows iOS 26 design principles
✅ **Scalable** - Easy to extend with additional tokens

---

## 📝 Notes

- All color shades are numbered 50-900 (lightest to darkest)
- Typography sizes include appropriate line heights
- Shadow tokens are designed for both light and dark modes
- Spacing follows the Apple Human Interface Guidelines
- All animations use hardware-accelerated transforms

---

## 🔧 Customization

To modify tokens, edit `tailwind.config.js` in the `theme.extend` section:

```javascript
// Example: Change primary blue
colors: {
  apple: {
    blue: {
      500: '#YOUR_COLOR', // Primary
      // ... other shades
    }
  }
}
```

Then rebuild: `npm run build`
