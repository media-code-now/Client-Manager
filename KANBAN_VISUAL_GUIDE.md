# Kanban Board - Quick Visual Guide

## What It Looks Like

```
┌────────────────────────────────────────────────────────────────────┐
│  Kanban Board                                                       │
│  Organize your tasks with drag and drop                            │
│                                                                    │
│  📊 Total: 23  ✨ In Progress: 8  ✅ Done: 12  ⚠️ Overdue: 3      │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ OPEN      5 [+]  │  │ IN PROGRESS 8 [+]│  │ DONE        12   │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│                  │  │                  │  │                  │
│┌────────────────┐│  │┌────────────────┐│  │┌────────────────┐│
││ Design mockups  ││  ││ Implement auth  ││  ││ Setup hosting   ││
││ 👥 Acme Corp    ││  ││ 👥 TechStart    ││  ││ 👥 DesignCo    ││
││ HIGH ⚠️ Mar 10  ││  ││ MED  ✓ Mar 08   ││  ││ LOW  ✓ Mar 05   ││
││ ...             ││  ││ ...             ││  ││ ...             ││
│└────────────────┘│  │└────────────────┘│  │└────────────────┘│
│                  │  │                  │  │                  │
│┌────────────────┐│  │┌────────────────┐│  │┌────────────────┐│
││ Database setup  ││  ││ Testing phase   ││  ││ Client review   ││
││ 👥 Dev Studio   ││  ││ 👥 QA Team      ││  ││ 👥 StartupXYZ   ││
││ MED  ✓ Mar 15   ││  ││ HIGH ⚠️ Mar 09  ││  ││ LOW  ✓ Mar 03   ││
││ ...             ││  ││ ...             ││  ││ ...             ││
│└────────────────┘│  │└────────────────┘│  │└────────────────┘│
│                  │  │                  │  │                  │
│     [No more]    │  │┌────────────────┐│  │     [All done]   │
│                  │  ││ Code review     ││  │                  │
│                  │  ││ 👥 Tech Startup ││  │                  │
│                  │  ││ HIGH ✓ Mar 12   ││  │                  │
│                  │  ││ ...             ││  │                  │
│                  │  │└────────────────┘│  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Task Card Details

### Task Card (Collapsed)
```
┌──────────────────────────┐
│ Design mockups        ⋯  │ ← Title + Menu
│ 👥 Acme Corp            │ ← Client (clickable)
│ HIGH  ⚠️ Overdue: Mar 10  │ ← Priority + Due Date
└──────────────────────────┘
  ↑ Click to expand
```

### Task Card (Expanded)
```
┌──────────────────────────────────┐
│ Design mockups              ⋯    │ ← Title + Menu
│ 👥 Acme Corp                      │ ← Client
│ HIGH  ⚠️ Overdue: Mar 10          │ ← Priority + Due
│                                   │
│ Create wireframes for the new     │ ← Description
│ dashboard according to the specs. │
│                                   │
│ [✓ Complete]  [More...]          │ ← Action buttons
└──────────────────────────────────┘
```

## Drag and Drop Flow

### Step 1: Drag Task
```
OPEN Column              IN PROGRESS Column
┌─────────────────┐      ┌─────────────────┐
│ Task A ╱╲╱╲     │ ──→  │                 │
│ (being dragged) │      │                 │
│                 │      │                 │
└─────────────────┘      └─────────────────┘

    Cursor: grab
```

### Step 2: Hover Over Column
```
OPEN Column              IN PROGRESS Column
┌─────────────────┐      ┌─────────────────┐
│                 │      │ ✨ Drop zone    │
│ Task B          │      │ highlighted     │
│                 │  ←─  │ (ready to drop) │
│ Task C          │      │                 │
└─────────────────┘      └─────────────────┘

    Cursor: grabbing
```

### Step 3: Drop Task
```
OPEN Column              IN PROGRESS Column
┌─────────────────┐      ┌─────────────────┐
│ Task B          │      │ Task A          │ ← Moved!
│                 │      │ (status updated)│
│ Task C          │      │                 │
└─────────────────┘      └─────────────────┘

    Task status changed from Open → In Progress
```

## Adding a Task

### Step 1: Click + Button
```
OPEN Column [+]
┌─────────────────┐
│ Task A          │
│ Task B          │
└─────────────────┘
      ↓
    Click adds form
```

### Step 2: Fill Form
```
Enter Task Title:
[Design dashboard    ]

Select Client:
[▼ Acme Corp]

[Add Task]  [Cancel]
```

### Step 3: Task Created
```
OPEN Column
┌─────────────────┐
│ Design dashboard│ ← New task
│ Task A          │
│ Task B          │
└─────────────────┘
```

## Status Column Headers

### Open Column
```
┌──────────────────┐
│ OPEN       5  [+]│
│ (gray header)    │
│ 5 tasks waiting  │
└──────────────────┘
```

### In Progress Column
```
┌──────────────────┐
│ IN PROGRESS 8 [+]│
│ (blue header)    │
│ 8 tasks active   │
└──────────────────┘
```

### Done Column
```
┌──────────────────┐
│ DONE          12 │
│ (green header)   │
│ 12 tasks done    │
└──────────────────┘
```

## Statistics Bar

```
┌────────┐  ┌────────────┐  ┌────────┐  ┌──────────┐
│ Total: │  │In Progress:│  │  Done: │  │ Overdue: │
│   23   │  │     8      │  │   12   │  │    3     │
└────────┘  └────────────┘  └────────┘  └──────────┘
  White       Blue             Green        Red
```

## Color System

### Column Headers
- **Open**: Gray background
- **In Progress**: Blue background
- **Done**: Green background

### Priority Badges
- **HIGH**: Red background, white text ⚠️
- **MEDIUM**: Yellow background, dark text 🟡
- **LOW**: Green background, dark text ✓

### Due Dates
- **On Time**: Normal text (slate gray)
- **Overdue**: Red text with ⚠️ warning icon
- **Today**: "Today" label
- **Tomorrow**: "Tomorrow" label

### Task Cards
- **Light Mode**: White cards with subtle shadows
- **Dark Mode**: Dark slate cards with proper contrast

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus task | Tab |
| Expand task | Enter |
| Close menu | Escape |
| Submit form | Enter |
| Add task in column | Click +, then Enter |

## Responsive Breakpoints

### Desktop (1024px+)
- 3 columns side by side
- Task cards full width
- Hover effects visible

### Tablet (768px - 1023px)
- 3 columns with adjusted spacing
- Smaller task cards
- Touch-optimized

### Mobile (< 768px)
- Columns may stack or scroll horizontally
- Touch-friendly drag
- Larger buttons for touch
- Full-width cards

## Empty States

### Empty Column
```
┌─────────────────────┐
│ OPEN            [+] │
├─────────────────────┤
│                     │
│  ╱╱ No tasks yet    │
│      Drag tasks here│
│      or add new ones│
│                     │
└─────────────────────┘
```

### No Overdue
```
Stats bar shows:
Total | In Progress | Done
(No "Overdue" badge if none)
```

## Task Menu

Click the **⋯** (three dots) button on a task:

```
┌──────────────┐
│ 🗑️  Delete   │
│              │
│ Edit (future)│
│              │
│ Assign (future)
└──────────────┘
```

## Actions on Expanded Task

### Complete Button
```
[✓ Complete] - Moves task to Done column
```

### More Button
```
[More...]   - Opens menu with delete, etc.
```

## Statistics Update

As you drag tasks, stats update:
- Task moves from "Open" to "In Progress"
  - Open count: 5 → 4
  - In Progress count: 8 → 9

- Task moves to "Done"
  - In Progress count: 9 → 8
  - Done count: 12 → 13

## Theme Support

### Light Mode
- White backgrounds
- Dark gray text
- Colored accents
- Subtle shadows

### Dark Mode
- Dark slate backgrounds
- Light gray text
- Same colored accents
- Adapted shadows

## Browser Support

✅ Chrome (desktop/mobile)
✅ Firefox (desktop/mobile)
✅ Safari (desktop/mobile)
✅ Edge (desktop/mobile)

## Touch Support

✅ Drag on mobile
✅ Tap to expand
✅ Touch menu buttons
✅ Responsive design

---

**Perfect for managing your workflow visually!** 🚀
