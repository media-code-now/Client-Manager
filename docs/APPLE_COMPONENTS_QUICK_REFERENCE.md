# Apple iOS 26 Components - Quick Reference

Complete guide to using the Apple design components in your app.

## Import Components

```tsx
import {
  AppleCard,
  AppleButton,
  AppleInput,
  AppleHeader,
  AppleSwitch,
  AppleTabBar,
  AppleBadge,
  AppleSkeleton,
  AppleEmptyState,
  AppleProgress,
} from '@/components/apple/AppleComponents';
```

---

## Component Usage Examples

### AppleCard

**Glass Morphism Card** (floating effect):
```tsx
import { AppleCard } from '@/components/apple/AppleComponents';
import { UserGroupIcon } from '@heroicons/react/24/outline';

<AppleCard
  title="Active Clients"
  subtitle="Last 30 days"
  icon={UserGroupIcon}
  glassmorphism={true}
>
  <div className="text-4xl font-bold text-blue-600">
    42
  </div>
</AppleCard>
```

**Solid Card**:
```tsx
<AppleCard
  title="Client Details"
  glassmorphism={false}
>
  <div className="space-y-2">
    <p>Email: john@example.com</p>
    <p>Phone: +1 234 567 8900</p>
  </div>
</AppleCard>
```

**Interactive Card**:
```tsx
<AppleCard
  title="Click me"
  interactive={true}
  onClick={() => console.log('Clicked!')}
>
  This card responds to clicks
</AppleCard>
```

---

### AppleButton

**Primary Button**:
```tsx
<AppleButton
  variant="primary"
  size="md"
  onClick={handleSave}
>
  Save
</AppleButton>
```

**With Icon**:
```tsx
import { PlusIcon } from '@heroicons/react/24/outline';

<AppleButton
  variant="primary"
  size="md"
  icon={PlusIcon}
>
  Add Client
</AppleButton>
```

**Secondary Button**:
```tsx
<AppleButton variant="secondary">
  Cancel
</AppleButton>
```

**Glass Button**:
```tsx
<AppleButton variant="glass">
  Learn More
</AppleButton>
```

**Destructive Button**:
```tsx
<AppleButton
  variant="destructive"
  onClick={handleDelete}
>
  Delete
</AppleButton>
```

**Small Button**:
```tsx
<AppleButton size="sm">
  Copy
</AppleButton>
```

**Large Button**:
```tsx
<AppleButton size="lg">
  Get Started
</AppleButton>
```

**Loading State**:
```tsx
<AppleButton
  isLoading={isLoading}
  disabled={isLoading}
>
  {isLoading ? 'Saving...' : 'Save'}
</AppleButton>
```

---

### AppleInput

**Basic Input**:
```tsx
<AppleInput
  type="text"
  placeholder="Enter name..."
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

**With Label and Error**:
```tsx
<AppleInput
  label="Email"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
/>
```

**With Icon**:
```tsx
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

<AppleInput
  icon={MagnifyingGlassIcon}
  type="text"
  placeholder="Search..."
  glassmorphism={true}
/>
```

**With Helper Text**:
```tsx
<AppleInput
  label="Password"
  type="password"
  helperText="Minimum 8 characters"
  placeholder="••••••••"
/>
```

---

### AppleHeader

**Basic Header**:
```tsx
<AppleHeader
  title="Clients"
  subtitle="Manage your clients"
/>
```

**With Actions**:
```tsx
<AppleHeader
  title="Dashboard"
  subtitle="Welcome back"
  actions={
    <AppleButton size="sm" icon={BellIcon} />
  }
/>
```

**With Back Button**:
```tsx
<AppleHeader
  title="Client Details"
  backButton={() => navigate('/clients')}
/>
```

---

### AppleSwitch

**Basic Toggle**:
```tsx
const [notifications, setNotifications] = useState(true);

<AppleSwitch
  checked={notifications}
  onChange={setNotifications}
/>
```

**With Label**:
```tsx
<AppleSwitch
  label="Enable Notifications"
  checked={notifications}
  onChange={setNotifications}
/>
```

**Disabled**:
```tsx
<AppleSwitch
  checked={true}
  disabled={true}
/>
```

---

### AppleTabBar

**Bottom Navigation**:
```tsx
import {
  HomeIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  BellIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const tabs = [
  { id: 'dashboard', label: 'Home', icon: HomeIcon },
  { id: 'clients', label: 'Clients', icon: UserGroupIcon },
  { id: 'tasks', label: 'Tasks', icon: CheckBadgeIcon },
  { id: 'notifications', label: 'Alerts', icon: BellIcon, badge: 3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

const [activeTab, setActiveTab] = useState('dashboard');

<AppleTabBar
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  position="bottom"
/>
```

**With Badges**:
```tsx
const tabs = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'messages', label: 'Messages', icon: ChatIcon, badge: 5 },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

<AppleTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
```

---

### AppleBadge

**Status Badge**:
```tsx
<AppleBadge variant="success">Active</AppleBadge>
<AppleBadge variant="warning">Pending</AppleBadge>
<AppleBadge variant="error">Cancelled</AppleBadge>
```

**With Icon**:
```tsx
import { CheckCircleIcon } from '@heroicons/react/24/solid';

<AppleBadge
  variant="success"
  icon={CheckCircleIcon}
>
  Completed
</AppleBadge>
```

**Different Sizes**:
```tsx
<AppleBadge size="sm">Small</AppleBadge>
<AppleBadge size="md">Medium</AppleBadge>
```

---

### AppleSkeleton

**Text Skeleton**:
```tsx
{isLoading && <AppleSkeleton variant="text" />}
{!isLoading && <p>Content loaded</p>}
```

**Card Skeleton**:
```tsx
<AppleSkeleton variant="card" className="mb-4" />
```

**Avatar Skeleton**:
```tsx
<AppleSkeleton variant="avatar" />
```

**Multiple Skeletons**:
```tsx
<div className="space-y-4">
  <AppleSkeleton variant="text" />
  <AppleSkeleton variant="text" />
  <AppleSkeleton variant="text" className="w-3/4" />
</div>
```

---

### AppleEmptyState

**Basic Empty State**:
```tsx
import { FolderIcon } from '@heroicons/react/24/outline';

<AppleEmptyState
  icon={FolderIcon}
  title="No Clients"
  description="Start by adding your first client"
  action={
    <AppleButton variant="primary" icon={PlusIcon}>
      Add Client
    </AppleButton>
  }
/>
```

---

### AppleProgress

**Basic Progress Bar**:
```tsx
<AppleProgress value={65} max={100} />
```

**With Label**:
```tsx
<AppleProgress value={75} max={100} showLabel={true} />
```

**Different Variants**:
```tsx
<AppleProgress value={50} variant="primary" />
<AppleProgress value={75} variant="success" />
<AppleProgress value={30} variant="warning" />
<AppleProgress value={10} variant="error" />
```

**Different Sizes**:
```tsx
<AppleProgress value={50} size="sm" />
<AppleProgress value={50} size="md" />
<AppleProgress value={50} size="lg" />
```

---

## Common Patterns

### Card List

```tsx
<div className="space-y-3">
  {clients.map((client) => (
    <AppleCard
      key={client.id}
      title={client.name}
      subtitle={client.company}
      interactive={true}
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <AppleBadge variant={client.status === 'Active' ? 'success' : 'warning'}>
        {client.status}
      </AppleBadge>
    </AppleCard>
  ))}
</div>
```

### Form with Glass Input

```tsx
<AppleCard glassmorphism={true} title="Create Client">
  <div className="space-y-4">
    <AppleInput
      label="Name"
      placeholder="John Doe"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
    <AppleInput
      label="Email"
      type="email"
      placeholder="john@example.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    <div className="flex gap-3">
      <AppleButton variant="primary" onClick={handleSave}>
        Save
      </AppleButton>
      <AppleButton variant="secondary" onClick={handleCancel}>
        Cancel
      </AppleButton>
    </div>
  </div>
</AppleCard>
```

### Dashboard with Stats

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <AppleCard title="Total Clients" glassmorphism={true}>
    <div className="text-4xl font-bold text-blue-600">42</div>
  </AppleCard>

  <AppleCard title="Active Tasks" glassmorphism={true}>
    <div className="text-4xl font-bold text-green-500">18</div>
  </AppleCard>

  <AppleCard title="Completed" glassmorphism={true}>
    <div className="text-4xl font-bold text-emerald-500">156</div>
  </AppleCard>

  <AppleCard title="Overdue" glassmorphism={true}>
    <div className="text-4xl font-bold text-red-500">3</div>
  </AppleCard>
</div>
```

### Loading State

```tsx
{isLoading ? (
  <div className="space-y-4">
    <AppleSkeleton variant="card" />
    <AppleSkeleton variant="card" />
    <AppleSkeleton variant="card" />
  </div>
) : (
  <div className="space-y-3">
    {/* Content here */}
  </div>
)}
```

### Modal with Apple Styling

```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
    <div
      className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    />

    <AppleCard
      title="Confirm Action"
      className="relative w-full md:max-w-md rounded-3xl"
    >
      <p className="text-base text-slate-600 dark:text-slate-400 mb-6">
        Are you sure you want to proceed?
      </p>
      <div className="flex gap-3">
        <AppleButton
          variant="secondary"
          className="flex-1"
          onClick={() => setShowModal(false)}
        >
          Cancel
        </AppleButton>
        <AppleButton
          variant="primary"
          className="flex-1"
          onClick={handleConfirm}
        >
          Confirm
        </AppleButton>
      </div>
    </AppleCard>
  </div>
)}
```

---

## Design Token Values

### Spacing
```
2xs:  4px
xs:   8px
sm:   12px
md:   16px
lg:   24px
xl:   32px
2xl:  48px
```

### Typography
```
Caption 2:   11px, 500 weight
Caption 1:   13px, 400 weight
Subheadline: 15px, 400 weight
Body:        17px, 400 weight
Headline:    18px, 600 weight
Title 3:     20px, 600 weight
Title 2:     24px, 600 weight
Title 1:     34px, 600 weight
Display:     36px, 600 weight
```

### Colors
```
Primary:     #007AFF (Blue)
Success:     #34C759 (Green)
Warning:     #FF9500 (Orange)
Error:       #FF3B30 (Red)
Secondary:   #3C3C43 (Label)
Tertiary:    #8E8E93 (Secondary Label)
```

### Shadows
```
Level 1: 0 1px 3px rgba(0,0,0,0.1)
Level 2: 0 4px 6px rgba(0,0,0,0.1)
Level 3: 0 10px 15px rgba(0,0,0,0.1)
Level 4: 0 20px 25px rgba(0,0,0,0.1)
```

---

## Tips & Best Practices

1. **Consistency**: Use the same component variants across your app
2. **Spacing**: Always use the spacing scale (4, 8, 12, 16, 24, 32, 48px)
3. **Glass Effect**: Only use `glassmorphism={true}` for floating/overlaid elements
4. **Dark Mode**: All components support dark mode automatically
5. **Accessibility**: Always provide labels for form inputs
6. **Performance**: Use `AppleSkeleton` for loading states
7. **Mobile First**: Components are responsive by default
8. **Interactions**: Use `active:scale-95` for haptic-like feedback

---

## Migration Guide

### From old components to Apple components

**Before**:
```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded">
  Click me
</button>
```

**After**:
```tsx
<AppleButton variant="primary">
  Click me
</AppleButton>
```

### Update existing components gradually

1. Start with new components
2. Slowly replace old buttons with `AppleButton`
3. Replace cards with `AppleCard`
4. Update forms with `AppleInput`
5. Refresh navigation with `AppleHeader` and `AppleTabBar`

---

**Version**: 1.0  
**Last Updated**: April 10, 2026  
**Components**: 10  
**Status**: Ready to use
