# 🎯 QUICK START: Implement Task Filtering

**Goal**: Add advanced filtering to help users find tasks faster  
**Time**: 1-2 hours  
**Difficulty**: Low-Medium  
**Impact**: ⭐⭐⭐⭐ (High)

---

## 📋 What We're Building

A comprehensive task filtering system that allows users to:
- Filter by status, priority, client, due date, assigned person
- Combine multiple filters
- Save favorite filter combinations
- See filter results in real-time

---

## 🏗️ Implementation Plan

### Step 1: Add API Endpoint

Create a new file: `src/app/api/tasks/filtered/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { jwtDecode } from 'jwt-decode';

let sql: any = null;

function getSql() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(dbUrl);
  }
  return sql;
}

export async function GET(request: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwtDecode(token) as any;
    const userId = decoded.id;

    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const clientId = searchParams.get('clientId');
    const assignedTo = searchParams.get('assignedTo');
    const dueDateFrom = searchParams.get('dueDateFrom');
    const dueDateTo = searchParams.get('dueDateTo');
    const searchQuery = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getSql();

    // Build dynamic WHERE clause
    let whereConditions = ['1=1'];
    let params: any[] = [];

    if (status) {
      whereConditions.push('status = $1');
      params.push(status);
    }

    if (priority) {
      whereConditions.push(`priority = $${params.length + 1}`);
      params.push(priority);
    }

    if (clientId) {
      whereConditions.push(`client_id = $${params.length + 1}`);
      params.push(parseInt(clientId, 10));
    }

    if (assignedTo) {
      whereConditions.push(`assigned_to = $${params.length + 1}`);
      params.push(assignedTo);
    }

    if (dueDateFrom) {
      whereConditions.push(`due_date >= $${params.length + 1}`);
      params.push(dueDateFrom);
    }

    if (dueDateTo) {
      whereConditions.push(`due_date <= $${params.length + 1}`);
      params.push(dueDateTo);
    }

    if (searchQuery) {
      whereConditions.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
      params.push(`%${searchQuery}%`);
      params.push(`%${searchQuery}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`;
    const countResult = await db(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get paginated results with client info
    const query = `
      SELECT 
        t.*,
        c.name as client_name,
        c.status as client_status
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE ${whereClause}
      ORDER BY t.due_date ASC, t.priority DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit);
    params.push(offset);

    const tasks = await db(query, params);

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Error filtering tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Step 2: Create Filter UI Component

Create: `src/components/TaskFilters.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOptions {
  status?: string;
  priority?: string;
  clientId?: string;
  assignedTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

interface TaskFiltersProps {
  clients: Array<{ id: number; name: string }>;
  onFilterChange: (filters: FilterOptions) => void;
  isLoading?: boolean;
}

export function TaskFilters({ 
  clients, 
  onFilterChange, 
  isLoading = false 
}: TaskFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Quick filter buttons
  const quickFilters = [
    { label: 'Today', filters: { dueDateFrom: getTodayDate(), dueDateTo: getTodayDate() } },
    { label: 'This Week', filters: { dueDateFrom: getTodayDate(), dueDateTo: getWeekLaterDate() } },
    { label: 'Overdue', filters: { dueDateTo: getYesterdayDate(), status: 'pending' } },
    { label: 'Urgent', filters: { priority: 'critical' } },
  ];

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [onFilterChange]);

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const applyQuickFilter = (quickFilter: any) => {
    handleFilterChange(quickFilter.filters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-lg">
      {/* Quick Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Quick Filters
        </h3>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => applyQuickFilter(filter)}
              className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 
                text-blue-700 hover:bg-blue-200 transition-colors"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 
            dark:text-gray-300 hover:text-gray-900"
        >
          <ChevronDownIcon 
            className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Advanced Filters
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />

            {/* Status */}
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({ 
                ...filters, 
                status: e.target.value || undefined 
              })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
            </select>

            {/* Priority */}
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange({ 
                ...filters, 
                priority: e.target.value || undefined 
              })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Client */}
            <select
              value={filters.clientId || ''}
              onChange={(e) => handleFilterChange({ 
                ...filters, 
                clientId: e.target.value || undefined 
              })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            {/* Due Date From */}
            <input
              type="date"
              value={filters.dueDateFrom || ''}
              onChange={(e) => handleFilterChange({ 
                ...filters, 
                dueDateFrom: e.target.value || undefined 
              })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />

            {/* Due Date To */}
            <input
              type="date"
              value={filters.dueDateTo || ''}
              onChange={(e) => handleFilterChange({ 
                ...filters, 
                dueDateTo: e.target.value || undefined 
              })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => (
            value && (
              <span
                key={key}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 
                  text-blue-700 rounded-full text-sm"
              >
                {key}: {value}
                <button
                  onClick={() => handleFilterChange({ 
                    ...filters, 
                    [key]: undefined 
                  })}
                  className="hover:text-blue-900"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )
          ))}
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getWeekLaterDate(): string {
  const week = new Date();
  week.setDate(week.getDate() + 7);
  return week.toISOString().split('T')[0];
}
```

---

### Step 3: Integrate into Tasks Page

Modify: `src/app/tasks/page.tsx`

Add this to your tasks page component:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { TaskFilters } from '@/components/TaskFilters';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch clients for filter dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        setClients(data.data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  // Fetch filtered tasks
  const handleFilterChange = async (newFilters: any) => {
    setFilters(newFilters);
    setIsLoading(true);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });

      const response = await fetch(`/api/tasks/filtered?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error('Error fetching filtered tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tasks</h1>
      
      <TaskFilters 
        clients={clients}
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow">
            <h3 className="font-semibold">{task.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
            <div className="mt-2 flex gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {task.status}
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Testing Checklist

- [ ] API endpoint returns correct filtered results
- [ ] Quick filters work (Today, This Week, Overdue, Urgent)
- [ ] Advanced filters display correctly
- [ ] Combining filters works
- [ ] Clear filters button removes all filters
- [ ] Search by title/description works
- [ ] Pagination works
- [ ] Component displays on mobile

---

## 🚀 Next Steps After Implementation

1. Test thoroughly with sample data
2. Add more quick filter options based on user feedback
3. Add "Save Filter" feature to save favorite filters
4. Add export filtered results (CSV/PDF)
5. Move to next improvement feature

---

**Estimated completion**: 1-2 hours  
**Skill level needed**: Intermediate TypeScript/React  
**Need help?** Check CLIENT_TASK_IMPROVEMENTS.md for more features!
