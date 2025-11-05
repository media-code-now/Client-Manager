# Clients Tab UX Specification

## Overview
A split-view layout that mirrors iOS/iPadOS design language. Soft neutral background (`#F5F5F7`), layered glass cards (white/70 with 18px blur), generous spacing, and pill-shaped interactive elements. Desktop layout uses two columns: left list (~40%) and right preview (~60%). Responsive adjustments collapse into stacked sections on tablet/mobile.

## Top Header Row
- Container spans full width above split panels, sitting on a translucent bar with subtle shadow.
- Components (left to right):
  1. **Title:** “Clients” (SF Pro Display 28/34 semibold).
  2. **Search Pill:** rounded-full input (height ~44px) with leading magnifier icon, soft inner shadow, placeholder “Search clients…”.
  3. **Status Filter:** segmented pills (All / Active / Prospect / On hold / Archived), using switch-style capsule with active fill.
  4. **Tag Filter:** pill chips (multi-select); default neutral border, filled when active.
  5. **New Client Button:** pill button (`bg-white`, subtle drop shadow, plus icon + label) that lifts on hover.

## Left Panel: Client List
- Panel sits within rounded glass card, scrollable vertically (padding 12 top/bottom, 16 sides).
- **Row Structure (~72–80px tall):**
  - **Primary:** client name (SF Pro 17/22 semibold).
  - **Secondary:** company/industry (13/16, muted text).
  - **Status Pill:** right aligned, color-coded (Active=emerald 100, Prospect=blue 100, On hold=amber 100, Archived=s slate 100).
  - **Metrics Chips:** small pills below primary line: `Tasks: {openTasksCount}`, `Creds: {credentialsCount}`.
  - **Last Activity:** caption text or chip (“Active 2 days ago”, optional clock icon).
  - Hover: slight lift, larger shadow, icon scale to 1.05.
  - Selected row: elevated, brighter background, thin blue border, optional left accent bar.
- Provide empty-state message for no clients (“No clients yet — add your first one”).

## Right Panel: Client Preview
Large glass card with stacked sections separated by soft dividers (hairline white/40). Content scrolls if taller than viewport.

### Header Section
- Client name (24/30 semibold), company below (15/20).
- Status pill near the name; tags listed as chips below.
- Action buttons aligned right: pill buttons with icons for “Add task”, “Add credential”, “Edit client”.

### Quick Info
- Grid with pill chips showing:
  - Email (clickable, envelope icon).
  - Phone (tap-to-call).
  - Timezone (clock icon + text).
  - Website (outline pill with external link icon).
- Each chip uses white/80 background, thin border, gentle shadow.

### Tasks Preview
- Sub-card labeled “Recent Tasks”.
- Show last 3–5 tasks: title, status pill (Open/In progress/Done), due date chip, priority dot (color-coded).
- Provide “View all tasks” link/button at bottom.
- Empty state: “No tasks yet. Add one to get started.”

### Credentials Preview
- Sub-card labeled “Credentials”.
- List rows showing label, username, masked value (••••), trailing quick actions (copy/reveal placeholders).
- “Manage credentials” link.
- If none: “No credentials saved.”

### Notes
- Rounded textarea-style card displaying first few lines of internal notes.
- Include “View details” or “Edit notes” link.

## Visual Style & Motion
- Consistent rounding: cards 20–24px, pills 999px.
- Shadows: 0 20 40 rgba(15,23,42,0.12); use stronger shadow for active/hover states.
- Blur: base 18px for cards, 22px for modals.
- Motion: segmented control uses spring-like ease (250ms). Client selection crossfades right panel content with slight slide.
- Dark mode: adjust backgrounds to slate/dark equivalents, maintain contrast.

## Interaction Notes
- Segmented filters update list instantly; search filters both name and company.
- Selected client persists across session (optional).
- Accessibility: ensure focus rings for pills and list rows (1px white + blue outline).
- Provide keyboard support: up/down to move list, Enter/Space to select.
- Provide skeleton/loading states while data loads.
