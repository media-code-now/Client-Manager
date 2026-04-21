# 💾 Data Persistence Guide

## Overview
Your projects, tasks, appointments, and notes are now automatically saved to **browser localStorage**. This means your data persists even after:
- ✅ Closing the browser
- ✅ Refreshing the page
- ✅ Clearing browser cache (data stays unless explicitly cleared)
- ✅ Logging out and back in

## What Gets Saved?

### 1. **Projects** 📁
- Project name, description, status
- Priority, dates, budget, progress
- Deliverables and task IDs
- **Saved as:** `dashboard_projects` in localStorage

### 2. **Tasks** ✓
- Task title, description, status
- Priority level, due date
- Client association
- **Saved as:** `dashboard_tasks` in localStorage

### 3. **Appointments** 📅
- Appointment title, date, time
- Location, description
- Client association, status
- **Saved as:** `dashboard_appointments` in localStorage

### 4. **Notes** 📝
- Note title, content, tags
- Creation and update timestamps
- Pinned status
- Voice transcriptions (if applicable)
- **Saved as:** `dashboard_notes` in localStorage

## How It Works

### Automatic Saving
- Every time you create, update, or delete a project/task/appointment/note, it's **automatically saved to localStorage**
- No manual save button needed
- Changes are persisted immediately

### Automatic Loading
- When you load the dashboard, saved data is **automatically restored**
- If localStorage is empty, data starts fresh
- If data can't be parsed, it's skipped (to prevent crashes)

## Storage Limits

⚠️ **Important:** Browser localStorage has a limit of ~5-10 MB depending on the browser

**Current Usage Estimate:**
- Each project: ~0.5 KB
- Each task: ~0.3 KB
- Each appointment: ~0.2 KB
- Each note: ~1 KB

**You can safely store:**
- ✅ 1000+ projects
- ✅ 10,000+ tasks
- ✅ 5,000+ appointments
- ✅ 5,000+ notes

## Checking Your Saved Data

### In Browser DevTools
1. Open **DevTools** (F12 or Cmd+Opt+I)
2. Go to **Application** tab
3. Click **Local Storage** → Your domain
4. Look for keys starting with `dashboard_`

### Example Keys
- `dashboard_projects`
- `dashboard_tasks`
- `dashboard_appointments`
- `dashboard_notes`

## Clearing Saved Data

### Clear Specific Item Type
```javascript
// In browser console (DevTools)
localStorage.removeItem('dashboard_projects');
localStorage.removeItem('dashboard_tasks');
localStorage.removeItem('dashboard_appointments');
localStorage.removeItem('dashboard_notes');
```

### Clear All Dashboard Data
```javascript
// In browser console
Object.keys(localStorage)
  .filter(key => key.startsWith('dashboard_'))
  .forEach(key => localStorage.removeItem(key));
```

### Clear Everything
Settings → Clear Browsing Data → Local Storage

## Future Enhancements

### 🔄 Cloud Sync (Upcoming)
- Sync data to a backend database
- Access data from multiple devices
- Automatic backups
- Collaboration features

### ↩️ Undo/Redo
- Track change history
- Revert to previous versions

### 📤 Export/Import
- Export data as JSON
- Backup and restore
- Transfer data to other devices

## Troubleshooting

### Data Not Saving?
1. Check if **localStorage is enabled** in your browser
2. Check **storage quota** - you may be at the limit
3. Try **clearing cache** and reloading
4. Look in **DevTools Console** for error messages

### Data Not Loading?
1. Check **DevTools Application tab** to confirm data exists
2. Check **browser console** for parsing errors
3. Try **clearing localStorage** and recreating data

### Lost All Data?
- If you accidentally cleared localStorage, data is unfortunately gone
- **Recommendation:** Export important data regularly once backup feature is added

## Best Practices

### 💡 Tips
1. **Export regularly** (when feature is available)
2. **Use meaningful titles** for easy searching
3. **Organize with tags and filters**
4. **Archive completed projects** to reduce clutter

### ⚠️ Cautions
1. Don't rely on this alone for critical data
2. Clear browser cache carefully (can delete localStorage)
3. Private/Incognito mode doesn't persist localStorage
4. Switching browsers doesn't share data

## Data Structure

### Projects Structure
```json
{
  "id": "proj-123456",
  "name": "Website Redesign",
  "clientId": "client-1",
  "description": "...",
  "status": "In Progress",
  "priority": "High",
  "startDate": "2026-04-01",
  "endDate": "2026-05-01",
  "budget": 5000,
  "progress": 50,
  "taskIds": [],
  "deliverables": []
}
```

### Tasks Structure
```json
{
  "id": "task-123456",
  "clientId": "client-1",
  "title": "Design mockups",
  "status": "In progress",
  "priority": "High",
  "dueDate": "2026-04-25",
  "description": "..."
}
```

### Appointments Structure
```json
{
  "id": "apt-123456",
  "clientId": "client-1",
  "title": "Client Meeting",
  "date": "2026-04-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "location": "Conference Room A",
  "description": "...",
  "status": "scheduled"
}
```

### Notes Structure
```json
{
  "id": "note-123456",
  "title": "Meeting Notes",
  "content": "...",
  "tags": ["meeting", "client"],
  "isPinned": false,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T11:00:00Z"
}
```

## Summary

✅ **Your data is now automatically saved and restored**
- No setup required
- Works automatically in the background
- Survives page refreshes and app closures
- Limited only by browser storage limits (~5-10 MB)

For questions or issues, check the browser DevTools console for any error messages.
