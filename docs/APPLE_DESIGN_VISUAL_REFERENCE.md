# Apple iOS 26 Design - Visual Reference Card

## Color Palette

### System Colors
```
🔵 Primary Blue     #007AFF
🟢 System Green     #34C759
🔴 System Red       #FF3B30
🟠 System Orange    #FF9500
🟡 System Yellow    #FFCC00
💗 System Pink      #FF2D55
🟣 System Purple    #AF52DE
🔷 System Cyan      #32B4DC
```

### Grayscale
```
Primary Label       #000000 (light) / #FFFFFF (dark)
Secondary Label     #3C3C43 (light) / #EBEBF5 (dark)
Tertiary Label      #8E8E93
Quaternary Label    #D1D1D6 (light) / #5A5A5E (dark)
```

### Backgrounds
```
Primary             #FFFFFF (light) / #000000 (dark)
Secondary           #F2F2F7 (light) / #1C1C1E (dark)
Tertiary            #FFFFFF (light) / #2C2C2E (dark)
Elevated            #FFFFFF (light) / #1E1E1E (dark)
```

---

## Typography Hierarchy

```
DISPLAY LARGE       44px, 500 weight
Large, commanding, rarely used

DISPLAY             36px, 600 weight
Major page titles, hero text

TITLE 1             34px, 600 weight
Modal headers, large cards

TITLE 2             24px, 600 weight
Section headers, card titles

TITLE 3             20px, 600 weight
Subsection headers

HEADLINE            18px, 600 weight
Button labels, strong labels

BODY                17px, 400 weight
Main body text, descriptions

SUBHEADLINE         15px, 400 weight
Secondary labels, metadata

CAPTION 1           13px, 400 weight
Small text, labels

CAPTION 2           11px, 500 weight
Timestamps, annotations
```

---

## Spacing System

```
xs   4px    (minimum spacing)
sm   8px    (tight spacing)
md   12px   (standard spacing)
lg   16px   (comfortable spacing)
xl   24px   (generous spacing)
2xl  32px   (section spacing)
3xl  48px   (major spacing)
```

**Hierarchy:**
- Elements within components: 4-8px
- Between components: 12-16px
- Between sections: 24-32px
- Screen margins: 16px (safe area)

---

## Shadow Elevation System

```
LEVEL 1 (Subtle)
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(0, 0, 0, 0.06);
Use for: Hover states, slight elevation

LEVEL 2 (Card/Sheet)
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1),
            0 2px 4px rgba(0, 0, 0, 0.06);
Use for: Cards, panels, standard elevation

LEVEL 3 (Prominent)
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1),
            0 4px 6px rgba(0, 0, 0, 0.05);
Use for: Floating buttons, popovers

LEVEL 4 (Modal/Overlay)
box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1),
            0 10px 10px rgba(0, 0, 0, 0.04);
Use for: Modals, alerts, highest elevation
```

---

## Border Radius Scale

```
8px     Buttons, input fields, small elements
12px    Cards, badges, search bars
16px    Containers, sheet modals
20px    Large modals, hero sections
28px    Bottom sheets, floating panels
999px   Circles, fully rounded elements
```

---

## Component States

### Buttons

```
NORMAL    Default appearance
HOVER     Slightly darker color, cursor changes
ACTIVE    Scale down 95%, visual press feedback
DISABLED  Opacity 50%, cursor not-allowed
LOADING   Spinner animation, disabled state
```

### Form Inputs

```
EMPTY       Placeholder text visible
FOCUS       Ring-2 ring-blue-500
ERROR       Red border, error message
FILLED      Text entered, normal appearance
DISABLED    Opacity 50%, cursor not-allowed
```

### Cards

```
NORMAL      Base appearance
HOVER       Elevation increases, shadow grows
ACTIVE      Scale slightly, interactive feedback
DISABLED    Opacity 50%
LOADING     Skeleton placeholder shown
```

---

## Dark Mode Adjustments

### Shadows (Dark Mode)
```
LEVEL 1 Dark: 0 1px 3px rgba(0, 0, 0, 0.3)
LEVEL 2 Dark: 0 4px 6px rgba(0, 0, 0, 0.4)
LEVEL 3 Dark: 0 10px 15px rgba(0, 0, 0, 0.5)
LEVEL 4 Dark: 0 20px 25px rgba(0, 0, 0, 0.6)

Higher opacity to be visible against dark backgrounds
```

### Text Contrast (Dark Mode)
```
Primary Text:     #FFFFFF (100% contrast)
Secondary Text:   #EBEBF5 (95% contrast)
Tertiary Text:    #BEBCC6 (85% contrast)
Quaternary Text:  #8E8E93 (60% contrast)

All exceed 4.5:1 ratio (WCAG AA minimum)
```

---

## Glassmorphism Effect

```
Border:      border-white/20 (light)
             dark:border-white/10 (dark)

Background:  bg-white/30 (light)
             dark:bg-white/[0.05] (dark)

Backdrop:    backdrop-blur-xl (strong)
             backdrop-blur-md (medium)
             backdrop-blur-sm (subtle)

Use when: Floating elements, overlays, modals
```

---

## Animation Principles

### Duration
```
100ms  Micro-interactions (opacity, color)
150ms  Simple transitions (hover, focus)
200ms  Standard interactions (state changes)
300ms  Complex animations (slide, expand)
400ms+ Large transitions (page changes)
```

### Easing Functions
```
ease-out        Quick start, slow end (entrance)
ease-in         Slow start, quick end (exit)
ease-in-out     Smooth throughout (transitions)
cubic-bezier()  Spring-like motion (natural feel)
```

### Common Animations
```
Fade In         opacity: 0 → 1 (150ms)
Slide Up        translateY(12px) → 0 (300ms)
Bounce Subtle   translateY(0) → -4px → 0 (600ms)
Pulse Soft      opacity: 1 → 0.7 → 1 (2s infinite)
Scale Press     scale(100%) → 95% → 100% (150ms)
```

---

## Touch Target Sizes

```
MINIMUM     44x44px   (iOS standard)
COMFORTABLE 48x48px   (comfortable tap)
GENEROUS    56x56px   (easy touch)
BUTTON      44x24px   (minimum height)
ICON        24x24px   (icon size inside button)
```

All interactive elements must be at least 44x44px

---

## Accessibility Requirements

### Color Contrast
```
Normal Text:    4.5:1 minimum
Large Text:     3:1 minimum
Graphics/UI:    3:1 minimum
```

### Focus States
```
Always visible
Ring: 2px
Color: Blue (#007AFF)
Offset: 2px from element
```

### ARIA Labels
```
Every interactive element needs aria-label
Form inputs need <label> element
Buttons need clear text or aria-label
Images need alt text (or none if decorative)
```

---

## Responsive Breakpoints

```
Mobile       < 640px   (single column)
Tablet       640-1024px (two columns)
Desktop      > 1024px  (three+ columns)
Large Screen > 1280px  (sidebar + content)
```

### Mobile-First Approach
```
Default:        Mobile styling
@md (640px):    Add tablet adjustments
@lg (1024px):   Add desktop adjustments
```

---

## Component Quick Reference

| Component | Typical Size | Shadow | Border Radius | Use Case |
|-----------|--------------|--------|---------------|----------|
| Button | 44x24px min | Level 1 | 999px | Actions, CTAs |
| Card | 200x300px+ | Level 2 | 16px | Content containers |
| Badge | 32x20px | None | 999px | Labels, status |
| Input | 44px height | Level 1 | 8px | Forms, search |
| Header | 64px height | Level 2 | 0px | Page header |
| Modal | 340-600px | Level 4 | 20px | Dialogs, sheets |
| Avatar | 44x44px | Level 1 | 999px | User images |
| Tab | 60x44px | None | 0px | Navigation |

---

## Performance Optimization Tips

### DO ✓
- Use `transform` and `opacity` for animations
- Leverage GPU acceleration (will-change)
- Batch DOM updates
- Lazy load images
- Code split heavy modals
- Use CSS variables for theming

### DON'T ✗
- Animate `width`, `height`, `left`, `top`
- Create too many hover states
- Load all images at once
- Use too many animations
- Block main thread with JavaScript
- Ignore `prefers-reduced-motion`

---

## File Organization

```
src/
├── components/
│   ├── apple/
│   │   └── AppleComponents.tsx    (Library)
│   ├── DashboardLayout.tsx
│   └── ... (other components)
├── styles/
│   └── globals.css
├── types/
└── utils/

docs/
├── APPLE_iOS_DESIGN_ENHANCEMENT.md    (Full guide)
├── APPLE_DESIGN_IMPLEMENTATION.md     (Setup)
├── APPLE_COMPONENTS_QUICK_REFERENCE.md (Examples)
├── APPLE_DESIGN_SUMMARY.md             (Overview)
└── APPLE_DESIGN_VISUAL_REFERENCE.md   (This file)
```

---

## Quick Copy-Paste Classes

### Glass Card
```
rounded-2xl border border-white/20 dark:border-white/10 
bg-white/30 dark:bg-white/5 backdrop-blur-xl 
shadow-lg shadow-slate-900/5 dark:shadow-black/20
```

### Glass Input
```
rounded-lg border border-white/40 dark:border-white/10 
bg-white/20 dark:bg-white/[0.05] backdrop-blur-md 
text-slate-900 dark:text-slate-100 
placeholder-slate-500 dark:placeholder-slate-400
```

### Glass Button
```
border border-white/40 dark:border-white/10 
bg-white/20 dark:bg-white/[0.05] backdrop-blur-md 
hover:bg-white/30 dark:hover:bg-white/[0.1] 
text-slate-900 dark:text-slate-100
```

### Standard Card
```
rounded-2xl border border-slate-200 dark:border-slate-700 
bg-white dark:bg-slate-900 
shadow-md dark:shadow-lg
```

---

## Debugging Checklist

- [ ] Element has correct border-radius
- [ ] Shadows are appropriate for elevation
- [ ] Text color passes contrast requirements
- [ ] Touch targets are at least 44x44px
- [ ] Interactive states are visible
- [ ] Dark mode colors are correct
- [ ] Animations respect prefers-reduced-motion
- [ ] ARIA labels present
- [ ] Spacing follows system (4, 8, 12, 16, 24, 32, 48)
- [ ] Typography sizes from approved scale

---

**Version**: 1.0  
**Updated**: April 10, 2026  
**Status**: Production Ready

Print this page or save as PDF for quick reference while designing! 🍎
