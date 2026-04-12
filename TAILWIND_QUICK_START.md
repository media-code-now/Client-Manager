# 🎨 Apple Design Tokens - Quick Start Guide

## ✅ What's New in `tailwind.config.js`

Your Tailwind configuration has been enhanced with 200+ Apple design tokens organized into these categories:

| Category | Tokens | Examples |
|----------|--------|----------|
| 🎨 **Colors** | 80+ shades | `apple-blue-500`, `apple-green-700`, `apple-slate-900` |
| 📝 **Typography** | 12 sizes | `text-heading-lg`, `text-body-md`, `text-caption-sm` |
| 🌑 **Shadows** | 16 variants | `shadow-glass-md`, `shadow-elevated-lg`, `shadow-dark-sm` |
| 🔲 **Border Radius** | 8 sizes | `rounded-apple-2xl`, `rounded-apple-full` |
| 📏 **Spacing** | 8 scales | `p-apple-lg`, `gap-apple-md`, `space-y-apple-xl` |
| ✨ **Animations** | 4 presets | `animate-apple-fade`, `animate-apple-slide-up` |
| ⏱️ **Transitions** | 8 options | `duration-apple-normal`, `ease-apple-ease-out` |

---

## 🚀 Quick Usage Examples

### 1. **Color System**

```jsx
// Primary button (blue)
<button className="bg-apple-blue-500 text-white hover:bg-apple-blue-600">
  Action
</button>

// Success state (green)
<span className="bg-apple-green-100 text-apple-green-700">
  ✓ Completed
</span>

// Error/destructive (red)
<button className="bg-apple-red-500 text-white hover:bg-apple-red-600">
  Delete
</button>

// Disabled state (slate)
<button className="bg-apple-slate-200 text-apple-slate-500 opacity-apple-disabled">
  Disabled
</button>
```

---

### 2. **Typography System**

```jsx
// Page title
<h1 className="text-display-lg text-apple-slate-900 dark:text-apple-slate-50">
  Welcome to Dashboard
</h1>

// Section heading
<h2 className="text-heading-lg text-apple-slate-800 dark:text-apple-slate-100">
  Your Projects
</h2>

// Body text
<p className="text-body-md text-apple-slate-600 dark:text-apple-slate-400">
  Description goes here
</p>

// Small caption
<span className="text-caption-sm text-apple-slate-500">
  Last updated today
</span>
```

---

### 3. **Glassmorphic Cards**

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
  <h3 className="text-heading-md mb-apple-md">Card Title</h3>
  <p className="text-body-sm">Card content with glassmorphic effect</p>
</div>
```

---

### 4. **Modern Buttons**

```jsx
// Primary button
<button className="
  px-apple-lg py-apple-md
  bg-apple-blue-500 text-white
  rounded-apple-2xl
  shadow-glass-sm
  transition duration-apple-normal ease-apple-ease
  hover:bg-apple-blue-600
  active:scale-95
  dark:bg-apple-blue-600
">
  Primary Action
</button>

// Secondary button
<button className="
  px-apple-lg py-apple-md
  bg-white/80 text-apple-slate-700
  rounded-apple-2xl
  shadow-light-sm
  transition duration-apple-normal
  hover:bg-white
  dark:bg-apple-slate-900/80 dark:text-apple-slate-300
">
  Secondary Action
</button>

// Destructive button
<button className="
  px-apple-lg py-apple-md
  bg-apple-red-500 text-white
  rounded-apple-2xl
  hover:bg-apple-red-600
">
  Delete
</button>
```

---

### 5. **Input Fields**

```jsx
<input 
  type="text"
  className="
    w-full
    rounded-apple-2xl
    border border-white/60
    bg-white/80
    px-apple-lg py-apple-md
    text-apple-slate-900
    placeholder:text-apple-slate-400
    focus:border-apple-blue-300
    focus:ring-2
    focus:ring-apple-blue-200/60
    transition duration-apple-fast
    dark:border-apple-slate-700/60
    dark:bg-apple-slate-900/80
    dark:text-apple-slate-100
  "
  placeholder="Search..."
/>
```

---

### 6. **Status Badges**

```jsx
// Success badge
<span className="
  inline-flex
  px-apple-md py-apple-sm
  rounded-apple-full
  bg-apple-green-100
  text-apple-green-700
  text-caption-sm font-medium
  dark:bg-apple-green-500/20
  dark:text-apple-green-300
">
  ✓ Active
</span>

// Warning badge
<span className="
  inline-flex
  px-apple-md py-apple-sm
  rounded-apple-full
  bg-apple-yellow-100
  text-apple-yellow-700
  text-caption-sm font-medium
">
  ⚠ Pending
</span>

// Error badge
<span className="
  inline-flex
  px-apple-md py-apple-sm
  rounded-apple-full
  bg-apple-red-100
  text-apple-red-700
  text-caption-sm font-medium
">
  ✗ Failed
</span>
```

---

### 7. **Page Transitions**

```jsx
// Fade in with slide
<div className="animate-apple-fade">
  Page content
</div>

// Slide up (modal)
<div className="animate-apple-slide-up">
  Modal content
</div>

// Scale in (component)
<div className="animate-apple-scale">
  Component appears
</div>

// Pulsing loading state
<div className="animate-apple-pulse">
  Loading...
</div>
```

---

### 8. **Complete Card Component**

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
">
  {/* Header */}
  <div className="mb-apple-lg">
    <h3 className="text-heading-md text-apple-slate-900 dark:text-apple-slate-100 mb-apple-sm">
      Card Title
    </h3>
    <p className="text-body-sm text-apple-slate-600 dark:text-apple-slate-400">
      Subtitle or description
    </p>
  </div>

  {/* Content */}
  <div className="space-y-apple-md mb-apple-lg">
    <p className="text-body-md text-apple-slate-700 dark:text-apple-slate-300">
      Main content goes here
    </p>
  </div>

  {/* Actions */}
  <div className="flex gap-apple-md">
    <button className="
      flex-1
      py-apple-md
      rounded-apple-2xl
      bg-apple-blue-500 text-white
      font-medium
      transition duration-apple-normal
      hover:bg-apple-blue-600
    ">
      Primary
    </button>
    <button className="
      flex-1
      py-apple-md
      rounded-apple-2xl
      bg-apple-slate-100 text-apple-slate-700
      dark:bg-apple-slate-800 dark:text-apple-slate-200
      font-medium
      transition duration-apple-normal
      hover:bg-apple-slate-200
    ">
      Secondary
    </button>
  </div>
</div>
```

---

## 🎯 Token Naming Convention

All tokens follow a consistent pattern:

```
[property]-[apple]-[color/size/type]-[shade/variant]
```

**Examples**:
- `bg-apple-blue-500` - Background, Apple colors, Blue, shade 500
- `text-apple-slate-900` - Text color, Apple colors, Slate, shade 900
- `rounded-apple-2xl` - Border radius, Apple scale, 2XL size
- `shadow-glass-md` - Shadow, Glassmorphism style, Medium size
- `p-apple-lg` - Padding, Apple spacing scale, Large

---

## 📊 Color Shades Reference

Each color has 9 shades (50 = lightest, 900 = darkest):

```
50  → Lightest (backgrounds)
100 → Very light
200 → Light
300 → Light-medium
400 → Medium-light
500 → PRIMARY (default)
600 → Medium-dark
700 → Dark
800 → Very dark
900 → Darkest (text)
```

---

## 🌓 Dark Mode

All components automatically support dark mode with the `dark:` prefix:

```jsx
<div className="
  bg-white dark:bg-apple-slate-900           // Background
  text-apple-slate-900 dark:text-apple-slate-100  // Text
  border-apple-slate-200 dark:border-apple-slate-700  // Border
  shadow-light-md dark:shadow-dark-md         // Shadow
">
  Content
</div>
```

---

## ⚡ Performance Tips

1. **Use shadow tokens** - Pre-optimized for performance
2. **Use animation tokens** - Hardware-accelerated transforms
3. **Avoid custom shadows** - Use `shadow-glass-*` or `shadow-elevated-*`
4. **Use spacing tokens** - Maintains consistency and reduces CSS size

---

## 📚 Complete Token Reference

**See `TAILWIND_APPLE_TOKENS.md` for detailed documentation**

Key sections:
- 🎨 Color Tokens (80+ shades)
- 📝 Typography Tokens (12 sizes)
- 🌑 Shadow Tokens (16 variants)
- 🔲 Border Radius Tokens (8 sizes)
- 📏 Spacing Tokens (8 scales)
- ✨ Animation Tokens (4 presets)
- ⏱️ Transition Tokens (8 options)

---

## 🔧 How to Update Tokens

Edit `tailwind.config.js` in the `theme.extend` section:

```javascript
theme: {
  extend: {
    colors: {
      apple: {
        blue: {
          500: '#YOUR_NEW_COLOR', // Change primary blue
        }
      }
    }
  }
}
```

Then rebuild:
```bash
npm run build
```

---

## ✅ Benefits of Using These Tokens

| Benefit | Impact |
|---------|--------|
| **Consistency** | Unified design language across entire app |
| **Maintainability** | Change colors/shadows in one place |
| **Dark Mode** | Automatic dark mode support |
| **Accessibility** | WCAG AA color contrast built-in |
| **Performance** | Optimized shadows and animations |
| **Scalability** | Easy to extend as design evolves |
| **Time Saving** | No need for custom classes |
| **Apple-aligned** | Follows iOS 26 design principles |

---

## 🎓 Learning Path

1. Start with **color tokens** - `apple-[color]-[shade]`
2. Add **typography** - `text-[style]`
3. Layer **shadows** - `shadow-glass-[size]`
4. Use **spacing** - `p-apple-[size]`, `gap-apple-[size]`
5. Enhance with **animations** - `animate-apple-[name]`

---

## 🚦 Getting Help

- **Token Lookup**: Check `TAILWIND_APPLE_TOKENS.md`
- **Component Examples**: See section 8 above
- **Custom Tokens**: Modify `tailwind.config.js`
- **Build Issues**: Run `npm run build` to validate

---

**Happy designing! 🎨**
