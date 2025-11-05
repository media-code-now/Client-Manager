# iOS-Inspired CRM Dashboard Design

## Dashboard Layout
- **Landing shell:** full-width translucent top bar over a soft neutral `#F5F5F7` backdrop. Content sits on layered glass cards with 12–16px blur and a gentle vertical gradient.
- **Top bar:** left-aligned wordmark, centered search pill (leading icon, clear button, 0 10 30 rgba(0,0,0,0.08) shadow), right-aligned avatar and gear with hover menus.
- **Sidebar:** 72px fixed column, frosted blur, rounded icon buttons (active state glow). Tooltips appear on hover.
- **Main canvas:** greeting hero (“Hi Noam, here is your day”), horizontal quick stats cards with snap scrolling on tablet.
- **Today’s Tasks:** Reminders-style checklist, pill rows, swipe-able quick actions, spring check toggles.
- **Clients section:** iOS Settings-inspired cards with initials, name, status pill, chevron. Hover lift effect, opens detail view.
- **Client detail view:** hero header with status pill and quick action buttons, segmented control for Overview / Tasks / Credentials / Activity, each with native-feeling lists.
- **Modals:** full-screen glass sheets on tablet, rounded corners, bottom action bar, dismissible by close or backdrop tap.

## Component Hierarchy
- `AppShell`
  - `TopBar` (Logo, `SearchPill`, `ProfileMenuButton`, `SettingsButton`)
  - `SidebarNav` (NavItem: Dashboard, Clients, Tasks, Settings)
  - `MainContent`
    - `GreetingHeader`
    - `StatsRow` (StatsCard ×4)
    - `TodayTasksPanel` (TaskItem, TaskActionTray)
    - `ClientsPanel` (ClientCard grid/list, LoadMore)
- `ClientDetailView`
  - `ClientHeader` (Avatar, Name, StatusPill, `QuickActionButtons`)
  - `SegmentedControl` (Overview, Tasks, Credentials, Activity)
  - `ClientOverview` (ContactInfoCard, SummaryMetrics, RecentActivityList)
  - `ClientTasksList` (TaskItem, FilterChips, EmptyState)
  - `CredentialList` (CredentialRow, MaskedValue, ActionIcons, LastUpdated)
  - `ActivityTimeline` (TimelineItem)
- Shared: `GlassCard`, `PillButton`, `IconButton`, `Toggle`, `FilterChip`, `ModalSheet`, `TooltipBubble`, `DividerHairline`.

## Design Tokens
- **Colors**
  - Background `bg-default`: `#F5F5F7`
  - Surface `surface-glass`: `rgba(255,255,255,0.65)` + `blur(18px)`
  - Surface elevated: `rgba(255,255,255,0.8)` + `0 20 40 rgba(31,41,55,0.08)` shadow
  - Primary: `#0060FF`, Accent: `#34C759`, Warning: `#FF9500`, Critical: `#FF3B30`
  - Border hairline: `rgba(60,60,67,0.12)`
  - Text: primary `rgba(0,0,0,0.85)`, secondary `rgba(60,60,67,0.6)`, tertiary `rgba(60,60,67,0.38)`
- **Radii:** xs 8px · sm 12px · md 16px · lg 20px · xl 24px · pill 999px
- **Spacing:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- **Typography (SF Pro):**
  - Display 28/34 semibold, Title 22/28 semibold, Headline 17/22 semibold
  - Body 17/24 regular, Callout 16/22 medium, Subhead 15/20 regular
  - Caption 13/16 regular, Icon labels 11/13 medium
- **Shadows:** Level 0 inset hairline, Level 1 `0 4 12 rgba(0,0,0,0.06)`, Level 2 `0 15 45 rgba(15,23,42,0.12)`
- **Blur:** 18px cards, 22px modals, 30px sidebar

## Interaction Flow
- Default route loads Dashboard with greeting, stats, and Today’s Tasks; trackpad-friendly inertial scrolling.
- Navigation icons glide to sections; active state fills button with primary color and optional haptic cue.
- Search surfaces clients/tasks inline; Enter opens detail side panel.
- Task hover shows quick actions; check toggles animate with spring scale.
- Client selection transitions to detail view with segmented control sliding indicator.
- Credential reveal prompts confirmation; copy to clipboard emits confirmation chip and logs audit.
- Modals slide up from bottom, dim background with high-contrast blur.
- Responsive: sidebar collapses on tablet/phone, segmented controls become scrollable chips.

## iOS Feel Tips
- Use SF Symbols-aligned icon weights; match text and icon sizes.
- Apply spring animations (~250ms ease-out) for hover/tap states.
- Layer translucency and gentle gradients instead of opaque panels.
- Maintain generous whitespace; center-align headlines in hero sections.
- Keep borders at 0.5–1px with high blur; avoid harsh contrast.
- Integrate subtle sound/haptic feedback where platform allows; otherwise rely on motion and microinteractions.
