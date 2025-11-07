'use client';

import {
  ArrowLeftIcon,
  BellIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  HomeIcon,
  LanguageIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  SunIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import type { FC } from "react";
import { useMemo, useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";
import { getAccessToken, getAuthState } from "../utils/auth";

type ClientStatus = "Active" | "On hold" | "Archived";
type TaskStatus = "Open" | "In progress" | "Done";
type TaskPriority = "Low" | "Medium" | "High";

type Client = {
  id: string;
  name: string;
  company?: string;
  status: ClientStatus;
  email?: string;
  phone?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
};

type Task = {
  id: string;
  clientId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  description?: string;
};

type Credential = {
  id: string;
  clientId: string;
  label: string;
  username: string;
  maskedValue: string;
  url?: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  company?: string;
  role?: string;
  timezone?: string;
  language?: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
};

type AppearancePreferences = {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
  viewDensity: 'compact' | 'comfortable' | 'spacious';
  language: string;
  reducedMotion: boolean;
  highContrast: boolean;
};

type NotificationPreferences = {
  email: {
    tasksDue: boolean;
    tasksOverdue: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
    clientUpdates: boolean;
    systemAlerts: boolean;
  };
  push: {
    enabled: boolean;
    permission: 'granted' | 'denied' | 'default';
    taskReminders: boolean;
    clientActivity: boolean;
    systemNotifications: boolean;
  };
  taskReminders: {
    enabled: boolean;
    timing: '5min' | '15min' | '30min' | '1hour' | '2hours' | '1day';
    recurring: boolean;
    weekendsIncluded: boolean;
  };
  clientActivity: {
    statusChanges: boolean;
    newMessages: boolean;
    documentUploads: boolean;
    paymentUpdates: boolean;
    contractChanges: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
};

const mockAppearancePreferences: AppearancePreferences = {
  theme: 'system',
  colorScheme: 'blue',
  viewDensity: 'comfortable',
  language: 'en',
  reducedMotion: false,
  highContrast: false,
};

const mockNotificationPreferences: NotificationPreferences = {
  email: {
    tasksDue: true,
    tasksOverdue: true,
    dailyDigest: false,
    weeklyReport: true,
    clientUpdates: true,
    systemAlerts: true,
  },
  push: {
    enabled: false,
    permission: 'default',
    taskReminders: true,
    clientActivity: false,
    systemNotifications: true,
  },
  taskReminders: {
    enabled: true,
    timing: '15min',
    recurring: false,
    weekendsIncluded: false,
  },
  clientActivity: {
    statusChanges: true,
    newMessages: true,
    documentUploads: false,
    paymentUpdates: true,
    contractChanges: true,
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'America/New_York',
  },
};

const mockUserProfile: UserProfile = {
  id: "user-1",
  name: "John Doe",
  email: "john.doe@example.com",
  company: "CRM Solutions Inc.",
  role: "Account Manager",
  timezone: "America/New_York",
  language: "en",
  twoFactorEnabled: false,
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
};

// Demo tasks and credentials removed; will fetch from API

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const iosMotion = {
  hoverCard:
    "transition-all duration-200 ease-[cubic-bezier(0.24,0.68,0.5,1)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/12 focus-visible:-translate-y-0.5 dark:hover:shadow-slate-900/30",
  hoverButton:
    "transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-px active:scale-[0.99]",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white/70 dark:focus-visible:ring-offset-slate-900",
  tooltip:
    "transition-all duration-200 ease-[cubic-bezier(0.24,0.68,0.5,1)]",
};

const DashboardLayout: FC = () => {
  const { theme, setTheme } = useTheme();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeSection, setActiveSection] = useState<"overview" | "tasks" | "credentials" | "activity">(
    "overview"
  );
  const [activeNavItem, setActiveNavItem] = useState<string>("Dashboard");
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(true);
  const [clientView, setClientView] = useState<"list" | "detail">("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);
  const [showAddCredentialModal, setShowAddCredentialModal] = useState<boolean>(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("All Status");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>("All Priority");
  const [taskCreationContext, setTaskCreationContext] = useState<"client" | "tasks">("client");
  const [selectedDueDate, setSelectedDueDate] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [editSelectedDueDate, setEditSelectedDueDate] = useState<string>("");
  const [showEditCalendar, setShowEditCalendar] = useState<boolean>(false);
  const [calendarCurrentMonth, setCalendarCurrentMonth] = useState<Date>(new Date());
  const [editCalendarCurrentMonth, setEditCalendarCurrentMonth] = useState<Date>(new Date());
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("profile");
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [appearancePreferences, setAppearancePreferences] = useState<AppearancePreferences>(mockAppearancePreferences);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(mockNotificationPreferences);

  // Fetch clients from API with retry logic
  const fetchClients = async (retryCount = 0) => {
    try {
      setIsLoadingClients(true);
      const token = getAccessToken();
      
      if (!token) {
        console.error('No access token found');
        // Try to refresh the page auth state
        const authState = getAuthState();
        if (!authState.isAuthenticated) {
          console.log('User not authenticated, redirecting to login');
          window.location.href = '/login';
        }
        return;
      }

      console.log('Fetching clients with token:', token.substring(0, 10) + '...');

      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Clients API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Clients API data:', data);
        
        if (data.success && data.clients) {
          console.log('Setting clients:', data.clients.length, 'clients found');
          setClients(data.clients);
        } else {
          console.error('API returned success=false or no clients:', data);
          // Retry once if API returns invalid response
          if (retryCount < 1) {
            console.log('Retrying client fetch...');
            setTimeout(() => fetchClients(retryCount + 1), 1000);
          }
        }
      } else if (response.status === 401) {
        console.error('Unauthorized - token may be expired');
        // Try to use refresh token or redirect to login
        window.location.href = '/login';
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch clients:', response.status, response.statusText, errorData);
        // Retry once on other errors
        if (retryCount < 1) {
          console.log('Retrying client fetch after error...');
          setTimeout(() => fetchClients(retryCount + 1), 2000);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Retry once on network errors
      if (retryCount < 1) {
        console.log('Retrying client fetch after network error...');
        setTimeout(() => fetchClients(retryCount + 1), 2000);
      }
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Fetch clients on component mount and when token changes
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      console.log('Token found, fetching clients and tasks...');
      fetchClients();
      fetchTasks();
    } else {
      console.log('No token found, skipping data fetch');
    }
  }, []);

  // Re-fetch clients when the selectedClientId is empty (after refresh)
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      console.log('Setting first client as selected after data load');
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Also fetch clients when the component becomes visible (after login redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = getAccessToken();
        if (token && clients.length === 0) {
          console.log('Page became visible, refetching clients and tasks...');
          fetchClients();
          fetchTasks();
        }
      }
    };

    const handleWindowFocus = () => {
      const token = getAccessToken();
      if (token && clients.length === 0) {
        console.log('Window focused, refetching clients and tasks...');
        fetchClients();
        fetchTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [clients.length]);

  const navItems = [
    { label: "Dashboard", icon: HomeIcon },
    { label: "Clients", icon: UserGroupIcon },
    { label: "Tasks", icon: ClipboardDocumentListIcon },
    { label: "Settings", icon: Cog6ToothIcon },
  ];

  const selectedClient = useMemo<Client | undefined>(
    () => clients.find((client) => client.id === selectedClientId),
    [selectedClientId, clients]
  );

  const clientTasks = useMemo<Task[]>(
    () => tasks.filter((task) => task.clientId === selectedClientId),
    [selectedClientId, tasks]
  );

  const clientCredentials = useMemo<Credential[]>(
    () => credentials.filter((cred) => cred.clientId === selectedClientId),
    [selectedClientId, credentials]
  );

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== "Done"), [tasks]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0) && task.status !== "Done";
    }).length;
  }, [tasks]);

  const todaysTasks = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate).toDateString();
      return due === today && task.status !== "Done";
    });
  }, [tasks]);

  const statCards = useMemo(
    () => [
      {
        label: "Total clients",
        value: clients.length,
        icon: UserGroupIcon,
      },
      {
        label: "Open tasks",
        value: openTasks.length,
        icon: ClipboardDocumentListIcon,
      },
      {
        label: "Overdue tasks",
        value: overdueCount,
        icon: ExclamationTriangleIcon,
      },
      {
        label: "Stored credentials",
        value: credentials.length,
        icon: ShieldCheckIcon,
      },
    ],
    [clients.length, overdueCount, openTasks.length, credentials.length]
  );

  const todayLabel = (dateIso?: string) => {
    if (!dateIso) return "No due date";
    const date = new Date(dateIso);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dateOnly = date.toDateString();
    if (dateOnly === today.toDateString()) return "Today";
    if (dateOnly === tomorrow.toDateString()) return "Tomorrow";
    if (dateOnly === yesterday.toDateString()) return "Yesterday";
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
  };

  const renderClientManagement = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Client Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage all your clients, add new ones, and organize your contacts
            </p>
          </div>
          <button 
            onClick={() => setShowAddClientModal(true)}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            + Add New Client
          </button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <input
            type="search"
            placeholder="Search clients by name, company, or tags..."
            className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
          />
        </div>
        <div className="flex gap-2">
          <select className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/30">
            <option>All Status</option>
            <option>Active</option>
            <option>On hold</option>
            <option>Archived</option>
          </select>
          <select className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/30">
            <option>All Tags</option>
            <option>VIP</option>
            <option>Legal</option>
            <option>Finance</option>
            <option>Design</option>
            <option>Partner</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <div
            key={client.id}
            onClick={() => {
              setSelectedClientId(client.id);
              setClientView('detail');
            }}
            className="group cursor-pointer rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20 dark:hover:shadow-slate-950/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white shadow-lg">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {client.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {client.company || 'No company'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    client.status === 'Active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                      : client.status === 'On hold'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300'
                  }`}>
                    {client.status}
                  </span>
                  {client.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <p>{tasks.filter(task => task.clientId === client.id && task.status !== 'Done').length} open tasks</p>
                  <p>{credentials.filter(cred => cred.clientId === client.id).length} stored credentials</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClientId(client.id);
                  setClientView('detail');
                }}
                className="flex-1 rounded-2xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition-all hover:bg-white dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                View Details
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Edit functionality - could be added later
                  alert('Edit functionality coming soon!');
                }}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClient(client.id);
                }}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const renderClientDetail = () => {
    if (!selectedClient) return null;

    const clientTasks = tasks.filter(task => task.clientId === selectedClient.id);
    const clientCredentials = credentials.filter(cred => cred.clientId === selectedClient.id);

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setClientView('list')}
            className="rounded-2xl bg-white/80 p-3 text-slate-600 shadow-lg shadow-slate-900/10 transition-all hover:bg-white hover:-translate-y-0.5 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {selectedClient.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedClient.company || 'No company'} • {selectedClient.status}
            </p>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-semibold text-white shadow-lg">
              {selectedClient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {selectedClient.name}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {selectedClient.company}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedClient.status === 'Active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                    : selectedClient.status === 'On hold'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300'
                }`}>
                  {selectedClient.status}
                </span>
                {selectedClient.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {selectedClient.notes && (
            <div className="mt-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedClient.notes}
              </p>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Tasks ({clientTasks.length})
            </h3>
            <button 
              onClick={() => {
                setTaskCreationContext("client");
                setSelectedDueDate("");
                setShowCalendar(false);
                setShowAddTaskModal(true);
              }}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              + Add Task
            </button>
          </div>
          <div className="space-y-3">
            {clientTasks.length > 0 ? (
              clientTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {task.title}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        task.priority === 'High' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                          : task.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        task.status === 'Done' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                No tasks found for this client
              </p>
            )}
          </div>
        </div>

        {/* Credentials Section */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Credentials ({clientCredentials.length})
            </h3>
            <button 
              onClick={() => setShowAddCredentialModal(true)}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              + Add Credential
            </button>
          </div>
          <div className="space-y-3">
            {clientCredentials.length > 0 ? (
              clientCredentials.map((credential) => (
                <div
                  key={credential.id}
                  className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {credential.label}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Username: {credential.username}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Password: {credential.maskedValue}
                      </p>
                      {credential.url && (
                        <a
                          href={credential.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {credential.url}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        Copy
                      </button>
                      <button className="rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                No credentials found for this client
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Fetch tasks from API
  const fetchTasks = async (retryCount = 0) => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.log('No token found for tasks fetch');
        return;
      }

      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tasks) {
          setTasks(data.tasks);
        }
      } else if (response.status === 401) {
        console.error('Unauthorized - token may be expired for tasks');
      } else {
        console.error('Failed to fetch tasks:', response.status);
        if (retryCount < 1) {
          setTimeout(() => fetchTasks(retryCount + 1), 2000);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (retryCount < 1) {
        setTimeout(() => fetchTasks(retryCount + 1), 2000);
      }
    }
  };

  const handleAddClient = async (newClientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>) => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.error('No token for adding client');
        alert('Authentication error. Please log in again.');
        return;
      }

      console.log('Attempting to add client:', newClientData);

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClientData.name,
          company: newClientData.company || '',
          status: newClientData.status || 'Active',
          email: newClientData.email || '',
          phone: newClientData.phone || '',
          notes: newClientData.notes || '',
        }),
      });

      console.log('Add client response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Add client response data:', data);
        
        if (data.success && data.client) {
          setClients(prev => [...prev, data.client]);
          setShowAddClientModal(false);
          console.log('Client added successfully:', data.client);
          alert('Client added successfully!');
        } else {
          console.error('API returned success=false:', data);
          alert('Failed to add client: ' + (data.error || 'Unknown error'));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to add client:', response.status, errorData);
        alert(`Failed to add client: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.error('No token for deleting client');
        alert('Authentication error. Please log in again.');
        return;
      }

      // Confirm before deleting
      const client = clients.find(c => c.id === clientId);
      if (!client) return;
      
      const confirmed = window.confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`);
      if (!confirmed) return;

      console.log('Attempting to delete client:', clientId);

      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete client response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Delete client response data:', data);
        
        if (data.success) {
          setClients(prev => prev.filter(c => c.id !== clientId));
          // If we're viewing this client in detail, go back to list
          if (selectedClientId === clientId) {
            setClientView('list');
            setSelectedClientId('');
          }
          console.log('Client deleted successfully');
          alert('Client deleted successfully!');
        } else {
          console.error('API returned success=false:', data);
          alert('Failed to delete client: ' + (data.error || 'Unknown error'));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete client:', response.status, errorData);
        alert(`Failed to delete client: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const renderAddClientModal = () => {
    if (!showAddClientModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/90 dark:shadow-slate-950/30">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Add New Client
          </h2>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newClient = {
                name: formData.get('name') as string,
                company: formData.get('company') as string || undefined,
                status: formData.get('status') as ClientStatus,
                tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
              };
              handleAddClient(newClient);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Client Name *
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Company
              </label>
              <input
                name="company"
                type="text"
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status *
              </label>
              <select
                name="status"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
              >
                <option value="Active">Active</option>
                <option value="On hold">On hold</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tags
              </label>
              <input
                name="tags"
                type="text"
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter tags separated by commas (e.g., VIP, Legal, Finance)"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="flex-1 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition-all hover:bg-white dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add Client
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderTasksView = () => {
    // Filter tasks based on search query and filters
    const filteredTasks = tasks.filter(task => {
      const client = clients.find(c => c.id === task.clientId);
      
      // Search filter
      const searchMatch = !taskSearchQuery || 
        task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
        (client && client.name.toLowerCase().includes(taskSearchQuery.toLowerCase()));
      
      // Status filter
      const statusMatch = taskStatusFilter === "All Status" || task.status === taskStatusFilter;
      
      // Priority filter
      const priorityMatch = taskPriorityFilter === "All Priority" || task.priority === taskPriorityFilter;
      
      return searchMatch && statusMatch && priorityMatch;
    });

    // Sort filtered tasks by due date (upcoming first, then no due date, then overdue)
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      const now = new Date();
      
      // Both are overdue
      if (dateA < now && dateB < now) {
        return dateB.getTime() - dateA.getTime(); // Most recent overdue first
      }
      
      // One is overdue, one is not
      if (dateA < now) return 1;
      if (dateB < now) return -1;
      
      // Both are upcoming
      return dateA.getTime() - dateB.getTime();
    });

    const getTaskStatusColor = (status: TaskStatus) => {
      switch (status) {
        case 'Done':
          return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
        case 'In progress':
          return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
        default:
          return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300';
      }
    };

    const getPriorityColor = (priority: TaskPriority) => {
      switch (priority) {
        case 'High':
          return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
        case 'Medium':
          return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300';
        default:
          return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
      }
    };

    const isOverdue = (dueDate?: string) => {
      if (!dueDate) return false;
      return new Date(dueDate) < new Date();
    };

    const formatDueDate = (dueDate?: string) => {
      if (!dueDate) return 'No due date';
      
      const date = new Date(dueDate);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';
      if (diffDays > 0 && diffDays <= 7) return `Due in ${diffDays} days`;
      if (diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
      }
      
      return date.toLocaleDateString();
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Tasks Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              All tasks across your clients, sorted by due date
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setTaskCreationContext("tasks");
                setSelectedDueDate("");
                setShowCalendar(false);
                setShowAddTaskModal(true);
              }}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              + Add New Task
            </button>
            <select 
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
            >
              <option value="All Status">All Status</option>
              <option value="Open">Open</option>
              <option value="In progress">In progress</option>
              <option value="Done">Done</option>
            </select>
            <select 
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value)}
              className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
            >
              <option value="All Priority">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <input
              type="search"
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              placeholder="Search tasks by title, description, or client..."
              className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
            />
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 dark:bg-blue-500/20">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {tasks.length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Tasks</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-100 p-3 dark:bg-red-500/20">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {tasks.filter(task => isOverdue(task.dueDate) && task.status !== 'Done').length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-100 p-3 dark:bg-yellow-500/20">
                <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {tasks.filter(task => task.status === 'In progress').length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-green-100 p-3 dark:bg-green-500/20">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {tasks.filter(task => task.status === 'Done').length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {sortedTasks.length > 0 ? (
            sortedTasks.map((task) => {
              const client = clients.find(c => c.id === task.clientId);
              const overdueTask = isOverdue(task.dueDate) && task.status !== 'Done';
              
              return (
                <div
                  key={task.id}
                  className={`rounded-3xl border p-6 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl ${
                    overdueTask 
                      ? 'border-red-200 bg-red-50/70 shadow-red-900/5 dark:border-red-800/60 dark:bg-red-900/20 dark:shadow-red-950/20'
                      : 'border-white/60 bg-white/70 shadow-slate-900/5 dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${
                          overdueTask ? 'text-red-900 dark:text-red-100' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {task.title}
                        </h3>
                        {overdueTask && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-300">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mb-3 ${
                          overdueTask ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {client && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                            {client.name}
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        overdueTask ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {formatDueDate(task.dueDate)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => {
                          setEditingTask(task);
                          setEditSelectedDueDate(task.dueDate || "");
                          setShowEditCalendar(false);
                          setShowEditTaskModal(true);
                        }}
                        className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition-all hover:bg-white dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
                      >
                        Edit
                      </button>
                      {task.status !== 'Done' && (
                        <button 
                          onClick={() => {
                            setTasks(prev => prev.map(t => 
                              t.id === task.id ? { ...t, status: 'Done' as TaskStatus } : t
                            ));
                          }}
                          className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-green-600/25 transition-all hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-white/60 bg-white/70 p-12 text-center shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No tasks found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create your first task by going to a client's detail page.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCalendarPicker = (
    onDateSelect: (date: string) => void, 
    initialDate?: string, 
    isEditMode = false
  ) => {
    const today = new Date();
    const currentMonth = isEditMode ? editCalendarCurrentMonth : calendarCurrentMonth;
    const setCurrentMonth = isEditMode ? setEditCalendarCurrentMonth : setCalendarCurrentMonth;
    
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const isToday = (date: Date) => {
      return date.toDateString() === today.toDateString();
    };
    
    const isSelected = (date: Date) => {
      if (!selectedDueDate) return false;
      return date.toDateString() === new Date(selectedDueDate).toDateString();
    };
    
    const isCurrentMonth = (date: Date) => {
      return date.getMonth() === currentMonth.getMonth();
    };
    
    return (
      <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/95 z-50">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            →
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                const dateString = date.toISOString().split('T')[0];
                setSelectedDueDate(dateString);
                onDateSelect(dateString);
                setShowCalendar(false);
              }}
              className={`p-2 text-sm rounded-xl transition-all ${
                isSelected(date)
                  ? 'bg-blue-600 text-white'
                  : isToday(date)
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                  : isCurrentMonth(date)
                  ? 'text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800/50'
              }`}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              setSelectedDueDate('');
              onDateSelect('');
              setShowCalendar(false);
            }}
            className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const todayString = today.toISOString().split('T')[0];
              setSelectedDueDate(todayString);
              onDateSelect(todayString);
              setShowCalendar(false);
            }}
            className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            Today
          </button>
        </div>
      </div>
    );
  };

  const renderAddTaskModal = () => {
    if (!showAddTaskModal) return null;
    
    // For client context, we need a selected client. For tasks context, we don't.
    if (taskCreationContext === "client" && !selectedClient) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/90">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {taskCreationContext === "client" ? `Add New Task for ${selectedClient?.name}` : "Add New Task"}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const clientId = taskCreationContext === "client" 
                ? selectedClient?.id 
                : formData.get('clientId') as string;
              
              if (!clientId) {
                alert('Please select a client for this task.');
                return;
              }

              const newTask: Task = {
                id: `task-${Date.now()}`,
                clientId,
                title: formData.get('title') as string,
                description: formData.get('description') as string || undefined,
                status: formData.get('status') as TaskStatus,
                priority: formData.get('priority') as TaskPriority,
                dueDate: formData.get('dueDate') as string || undefined,
              };
              setTasks(prev => [...prev, newTask]);
              setShowAddTaskModal(false);
              setSelectedDueDate("");
              setShowCalendar(false);
            }}
            className="space-y-4"
          >
            {taskCreationContext === "tasks" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Client *
                </label>
                <select
                  name="clientId"
                  required
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company ? `- ${client.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Task Title *
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  required
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="Open">Open</option>
                  <option value="In progress">In progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Due Date
              </label>
              <div className="relative">
                <input
                  name="dueDate"
                  type="text"
                  readOnly
                  value={selectedDueDate ? new Date(selectedDueDate).toLocaleDateString() : ''}
                  onClick={() => {
                    if (!showCalendar && selectedDueDate) {
                      setCalendarCurrentMonth(new Date(selectedDueDate));
                    }
                    setShowCalendar(!showCalendar);
                  }}
                  placeholder="Select due date"
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!showCalendar && selectedDueDate) {
                      setCalendarCurrentMonth(new Date(selectedDueDate));
                    }
                    setShowCalendar(!showCalendar);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  📅
                </button>
                {showCalendar && (
                  <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)}>
                    <div onClick={(e) => e.stopPropagation()}>
                      {renderCalendarPicker((date) => {
                        // Update the hidden input for form submission
                        const hiddenInput = document.querySelector('input[name="dueDate"][type="hidden"]') as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = date;
                        }
                      }, selectedDueDate, false)}
                    </div>
                  </div>
                )}
              </div>
              <input
                name="dueDate"
                type="hidden"
                value={selectedDueDate}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setSelectedDueDate("");
                  setShowCalendar(false);
                }}
                className="flex-1 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition-all hover:bg-white dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderAddCredentialModal = () => {
    if (!showAddCredentialModal || !selectedClient) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/90">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            Add New Credential for {selectedClient.name}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const password = formData.get('password') as string;
              const newCredential: Credential = {
                id: `cred-${Date.now()}`,
                clientId: selectedClient.id,
                label: formData.get('label') as string,
                username: formData.get('username') as string,
                maskedValue: '••••' + password.slice(-4),
                url: formData.get('url') as string || undefined,
              };
              setCredentials(prev => [...prev, newCredential]);
              setShowAddCredentialModal(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Label *
              </label>
              <input
                name="label"
                type="text"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="e.g., Admin Portal, API Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Username/Email *
              </label>
              <input
                name="username"
                type="text"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter username or email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password *
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                URL (optional)
              </label>
              <input
                name="url"
                type="url"
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="https://example.com"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddCredentialModal(false)}
                className="flex-1 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition-all hover:bg-white dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add Credential
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderSettingsView = () => {
    const settingsTabs = [
      { id: "profile", label: "Profile & Account", icon: UserCircleIcon },
      { id: "appearance", label: "Appearance", icon: PaintBrushIcon },
      { id: "notifications", label: "Notifications", icon: BellIcon },
      { id: "security", label: "Security & Privacy", icon: ShieldCheckIcon },
      { id: "business", label: "Business Settings", icon: BuildingOfficeIcon },
      { id: "system", label: "System", icon: Cog6ToothIcon },
    ];

    const renderProfileTab = () => (
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Profile Information
          </h3>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              setUserProfile(prev => ({
                ...prev,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                company: formData.get('company') as string || undefined,
                role: formData.get('role') as string || undefined,
              }));
            }}
            className="space-y-4"
          >
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-semibold text-white shadow-lg">
                {userProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <button
                  type="button"
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Change Avatar
                </button>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG or GIF. Max size of 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={userProfile.name}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={userProfile.email}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company
                </label>
                <input
                  name="company"
                  type="text"
                  defaultValue={userProfile.company}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Role
                </label>
                <input
                  name="role"
                  type="text"
                  defaultValue={userProfile.role}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Password & Security
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Keep your account secure with a strong password
              </p>
            </div>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="rounded-2xl bg-slate-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-600/25 transition-all hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600"
            >
              Change Password
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Two-Factor Authentication
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserProfile(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userProfile.twoFactorEnabled 
                    ? 'bg-blue-600' 
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userProfile.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Preferences */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Account Preferences
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Timezone
                </label>
                <select
                  value={userProfile.timezone}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Language
                </label>
                <select
                  value={userProfile.language}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Notification Preferences
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Email Notifications
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <button
                    onClick={() => setUserProfile(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      userProfile.emailNotifications 
                        ? 'bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userProfile.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Push Notifications
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <button
                    onClick={() => setUserProfile(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      userProfile.pushNotifications 
                        ? 'bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userProfile.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Marketing Emails
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive product updates and marketing emails
                    </p>
                  </div>
                  <button
                    onClick={() => setUserProfile(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      userProfile.marketingEmails 
                        ? 'bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userProfile.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const renderAppearanceTab = () => (
      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Theme Preferences
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Choose your theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: SunIcon },
                  { id: 'dark', label: 'Dark', icon: MoonIcon },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setTheme(id as 'light' | 'dark');
                      setAppearancePreferences(prev => ({ ...prev, theme: id as any }));
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-all ${
                      theme === id
                        ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-inner shadow-blue-200/50 dark:border-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Color Scheme
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Choose your accent colors
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { id: 'blue', label: 'Blue', colors: 'from-blue-500 to-blue-600', bg: 'bg-blue-600' },
                  { id: 'purple', label: 'Purple', colors: 'from-purple-500 to-purple-600', bg: 'bg-purple-600' },
                  { id: 'green', label: 'Green', colors: 'from-green-500 to-green-600', bg: 'bg-green-600' },
                  { id: 'orange', label: 'Orange', colors: 'from-orange-500 to-orange-600', bg: 'bg-orange-600' },
                  { id: 'pink', label: 'Pink', colors: 'from-pink-500 to-pink-600', bg: 'bg-pink-600' },
                ].map(({ id, label, colors, bg }) => (
                  <button
                    key={id}
                    onClick={() => setAppearancePreferences(prev => ({ ...prev, colorScheme: id as any }))}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                      appearancePreferences.colorScheme === id
                        ? 'border-slate-300 bg-slate-50 shadow-inner shadow-slate-200/50 dark:border-slate-600 dark:bg-slate-800/50'
                        : 'border-white/60 bg-white/80 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${colors} shadow-lg ${
                      appearancePreferences.colorScheme === id ? 'ring-2 ring-slate-400 dark:ring-slate-500' : ''
                    }`} />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View Density */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Layout & Density
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Interface density
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'compact', label: 'Compact', description: 'More content in less space' },
                  { id: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
                  { id: 'spacious', label: 'Spacious', description: 'Extra breathing room' },
                ].map(({ id, label, description }) => (
                  <button
                    key={id}
                    onClick={() => setAppearancePreferences(prev => ({ ...prev, viewDensity: id as any }))}
                    className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                      appearancePreferences.viewDensity === id
                        ? 'border-blue-300 bg-blue-50 shadow-inner shadow-blue-200/50 dark:border-blue-600 dark:bg-blue-500/20'
                        : 'border-white/60 bg-white/80 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      appearancePreferences.viewDensity === id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {label}
                    </div>
                    <div className={`text-xs ${
                      appearancePreferences.viewDensity === id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Language & Accessibility */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Language & Accessibility
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Display Language
              </label>
              <select
                value={appearancePreferences.language}
                onChange={(e) => setAppearancePreferences(prev => ({ ...prev, language: e.target.value }))}
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
              >
                <option value="en">English</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="it">Italiano (Italian)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="ru">Русский (Russian)</option>
              </select>
            </div>

            {/* Accessibility Options */}
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Accessibility
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="flex items-center gap-3">
                    <EyeIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        High Contrast
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Increase contrast for better visibility
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAppearancePreferences(prev => ({ ...prev, highContrast: !prev.highContrast }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      appearancePreferences.highContrast 
                        ? 'bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        appearancePreferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-slate-600 dark:bg-slate-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Reduce Motion
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Minimize animations and transitions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAppearancePreferences(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      appearancePreferences.reducedMotion 
                        ? 'bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        appearancePreferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Preview
          </h3>
          
          <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${
                appearancePreferences.colorScheme === 'blue' ? 'from-blue-500 to-blue-600' :
                appearancePreferences.colorScheme === 'purple' ? 'from-purple-500 to-purple-600' :
                appearancePreferences.colorScheme === 'green' ? 'from-green-500 to-green-600' :
                appearancePreferences.colorScheme === 'orange' ? 'from-orange-500 to-orange-600' :
                'from-pink-500 to-pink-600'
              } text-white flex items-center justify-center font-semibold`} />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Sample Component</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Density: {appearancePreferences.viewDensity} • Language: {appearancePreferences.language}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              This is how your interface will look with the selected preferences. 
              {appearancePreferences.highContrast && ' High contrast mode is enabled.'}
              {appearancePreferences.reducedMotion && ' Animations are reduced.'}
            </p>
            <button className={`px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg transition-all ${
              appearancePreferences.colorScheme === 'blue' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25' :
              appearancePreferences.colorScheme === 'purple' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25' :
              appearancePreferences.colorScheme === 'green' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/25' :
              appearancePreferences.colorScheme === 'orange' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25' :
              'bg-pink-600 hover:bg-pink-700 shadow-pink-600/25'
            }`}>
              Sample Button
            </button>
          </div>
        </div>
      </div>
    );

    const renderNotificationsTab = () => {
      const requestPushPermission = async () => {
        if ('Notification' in window) {
          try {
            const permission = await Notification.requestPermission();
            setNotificationPreferences(prev => ({
              ...prev,
              push: {
                ...prev.push,
                permission: permission as 'granted' | 'denied' | 'default',
                enabled: permission === 'granted' ? prev.push.enabled : false,
              }
            }));
          } catch (error) {
            console.error('Error requesting notification permission:', error);
          }
        }
      };

      return (
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3 mb-6">
              <EnvelopeIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Email Notifications
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Stay updated with important information via email
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Task-related email notifications */}
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Task Notifications
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Tasks Due Today
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Get notified about tasks due today
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        email: { ...prev.email, tasksDue: !prev.email.tasksDue }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.email.tasksDue 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.email.tasksDue ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Overdue Tasks
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Alerts for tasks that are past due
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        email: { ...prev.email, tasksOverdue: !prev.email.tasksOverdue }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.email.tasksOverdue 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.email.tasksOverdue ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Digest and report notifications */}
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Digest & Reports
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Daily Digest
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Summary of daily activities and upcoming tasks
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        email: { ...prev.email, dailyDigest: !prev.email.dailyDigest }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.email.dailyDigest 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.email.dailyDigest ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Weekly Report
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Weekly summary of client activity and task completion
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        email: { ...prev.email, weeklyReport: !prev.email.weeklyReport }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.email.weeklyReport 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.email.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* System notifications */}
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  System & Client Updates
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Client Updates
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Status changes, new messages, and client activity
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        email: { ...prev.email, clientUpdates: !prev.email.clientUpdates }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.email.clientUpdates 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.email.clientUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        System Alerts
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Important system notifications and security alerts
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        email: { ...prev.email, systemAlerts: !prev.email.systemAlerts }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.email.systemAlerts 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.email.systemAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3 mb-6">
              <DevicePhoneMobileIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Browser Push Notifications
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Get instant notifications in your browser
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Push permission status */}
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Push Notifications
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Status: {notificationPreferences.push.permission === 'granted' ? 'Allowed' : 
                               notificationPreferences.push.permission === 'denied' ? 'Blocked' : 'Not requested'}
                    </p>
                  </div>
                  {notificationPreferences.push.permission === 'default' && (
                    <button
                      onClick={requestPushPermission}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
                    >
                      Enable
                    </button>
                  )}
                  {notificationPreferences.push.permission === 'granted' && (
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        push: { ...prev.push, enabled: !prev.push.enabled }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.push.enabled 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.push.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>
                
                {notificationPreferences.push.permission === 'denied' && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/60 dark:bg-red-900/20">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Push notifications are blocked. Please enable them in your browser settings to receive real-time updates.
                    </p>
                  </div>
                )}
              </div>

              {/* Push notification types */}
              {notificationPreferences.push.permission === 'granted' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Task Reminders
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Get notified before tasks are due
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        push: { ...prev.push, taskReminders: !prev.push.taskReminders }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.push.taskReminders 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      disabled={!notificationPreferences.push.enabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.push.taskReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Client Activity
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        New messages and status changes
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        push: { ...prev.push, clientActivity: !prev.push.clientActivity }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.push.clientActivity 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      disabled={!notificationPreferences.push.enabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.push.clientActivity ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task Reminder Settings */}
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3 mb-6">
              <ClockIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Task Reminder Settings
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure when and how you receive task reminders
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable task reminders */}
              <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Task Reminders
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enable automatic reminders for upcoming tasks
                  </p>
                </div>
                <button
                  onClick={() => setNotificationPreferences(prev => ({
                    ...prev,
                    taskReminders: { ...prev.taskReminders, enabled: !prev.taskReminders.enabled }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationPreferences.taskReminders.enabled 
                      ? 'bg-blue-600' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.taskReminders.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reminder timing */}
              {notificationPreferences.taskReminders.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Reminder Timing
                    </label>
                    <select
                      value={notificationPreferences.taskReminders.timing}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        taskReminders: { ...prev.taskReminders, timing: e.target.value as any }
                      }))}
                      className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                    >
                      <option value="5min">5 minutes before</option>
                      <option value="15min">15 minutes before</option>
                      <option value="30min">30 minutes before</option>
                      <option value="1hour">1 hour before</option>
                      <option value="2hours">2 hours before</option>
                      <option value="1day">1 day before</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Recurring Reminders
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Send multiple reminders for the same task
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        taskReminders: { ...prev.taskReminders, recurring: !prev.taskReminders.recurring }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.taskReminders.recurring 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.taskReminders.recurring ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Weekend Reminders
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Include weekends in reminder schedule
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationPreferences(prev => ({
                        ...prev,
                        taskReminders: { ...prev.taskReminders, weekendsIncluded: !prev.taskReminders.weekendsIncluded }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.taskReminders.weekendsIncluded 
                          ? 'bg-blue-600' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.taskReminders.weekendsIncluded ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client Activity Alerts */}
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3 mb-6">
              <BellIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Client Activity Alerts
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Get notified about important client interactions
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'statusChanges', label: 'Status Changes', description: 'When client status is updated' },
                { key: 'newMessages', label: 'New Messages', description: 'New communications from clients' },
                { key: 'documentUploads', label: 'Document Uploads', description: 'When clients upload new documents' },
                { key: 'paymentUpdates', label: 'Payment Updates', description: 'Payment received or invoice updates' },
                { key: 'contractChanges', label: 'Contract Changes', description: 'Contract modifications or renewals' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {description}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationPreferences(prev => ({
                      ...prev,
                      clientActivity: { 
                        ...prev.clientActivity, 
                        [key]: !prev.clientActivity[key as keyof typeof prev.clientActivity] 
                      }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPreferences.clientActivity[key as keyof typeof notificationPreferences.clientActivity]
                        ? 'bg-blue-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPreferences.clientActivity[key as keyof typeof notificationPreferences.clientActivity] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
            <div className="flex items-center gap-3 mb-6">
              <MoonIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Quiet Hours
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Set times when you don't want to receive notifications
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner shadow-white/40 dark:border-slate-700/60 dark:bg-slate-900/80">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Enable Quiet Hours
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pause non-urgent notifications during specified hours
                  </p>
                </div>
                <button
                  onClick={() => setNotificationPreferences(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationPreferences.quietHours.enabled 
                      ? 'bg-blue-600' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notificationPreferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={notificationPreferences.quietHours.startTime}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, startTime: e.target.value }
                      }))}
                      className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={notificationPreferences.quietHours.endTime}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, endTime: e.target.value }
                      }))}
                      className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Settings Navigation */}
          <div className="w-full lg:w-80">
            <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
              <nav className="space-y-2">
                {settingsTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSettingsTab(id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
                      activeSettingsTab === id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'text-slate-700 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-900/80'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            {activeSettingsTab === "profile" && renderProfileTab()}
            {activeSettingsTab === "appearance" && renderAppearanceTab()}
            {activeSettingsTab === "notifications" && renderNotificationsTab()}
            {activeSettingsTab === "security" && (
              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Security & Privacy
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Coming soon...
                </p>
              </div>
            )}
            {activeSettingsTab === "business" && (
              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Business Settings
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Coming soon...
                </p>
              </div>
            )}
            {activeSettingsTab === "system" && (
              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  System Settings
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEditTaskModal = () => {
    if (!showEditTaskModal || !editingTask) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/90">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            Edit Task
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedTask: Task = {
                ...editingTask,
                title: formData.get('title') as string,
                description: formData.get('description') as string || undefined,
                status: formData.get('status') as TaskStatus,
                priority: formData.get('priority') as TaskPriority,
                dueDate: formData.get('dueDate') as string || undefined,
              };
              setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
              setShowEditTaskModal(false);
              setEditingTask(null);
              setEditSelectedDueDate("");
              setShowEditCalendar(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Task Title *
              </label>
              <input
                name="title"
                type="text"
                required
                defaultValue={editingTask.title}
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={editingTask.description || ''}
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  required
                  defaultValue={editingTask.priority}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  defaultValue={editingTask.status}
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="Open">Open</option>
                  <option value="In progress">In progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Due Date
              </label>
              <div className="relative">
                <input
                  name="dueDate"
                  type="text"
                  readOnly
                  value={editSelectedDueDate ? new Date(editSelectedDueDate).toLocaleDateString() : (editingTask.dueDate ? new Date(editingTask.dueDate).toLocaleDateString() : '')}
                  onClick={() => {
                    if (!showEditCalendar) {
                      const dateToUse = editSelectedDueDate || editingTask.dueDate;
                      if (dateToUse) {
                        setEditCalendarCurrentMonth(new Date(dateToUse));
                      }
                    }
                    setShowEditCalendar(!showEditCalendar);
                  }}
                  placeholder="Select due date"
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!showEditCalendar) {
                      const dateToUse = editSelectedDueDate || editingTask.dueDate;
                      if (dateToUse) {
                        setEditCalendarCurrentMonth(new Date(dateToUse));
                      }
                    }
                    setShowEditCalendar(!showEditCalendar);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  📅
                </button>
                {showEditCalendar && (
                  <div className="fixed inset-0 z-40" onClick={() => setShowEditCalendar(false)}>
                    <div onClick={(e) => e.stopPropagation()}>
                      {renderCalendarPicker((date) => {
                        setEditSelectedDueDate(date);
                        // Update the hidden input for form submission
                        const hiddenInput = document.querySelector('input[name="dueDate"][type="hidden"]') as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = date;
                        }
                      }, editSelectedDueDate || editingTask.dueDate, true)}
                    </div>
                  </div>
                )}
              </div>
              <input
                name="dueDate"
                type="hidden"
                value={editSelectedDueDate || editingTask.dueDate || ''}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditTaskModal(false);
                  setEditingTask(null);
                  setEditSelectedDueDate("");
                  setShowEditCalendar(false);
                }}
                className="flex-1 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition-all hover:bg-white dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    setTasks(prev => prev.filter(t => t.id !== editingTask.id));
                    setShowEditTaskModal(false);
                    setEditingTask(null);
                    setEditSelectedDueDate("");
                    setShowEditCalendar(false);
                  }
                }}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Delete
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-screen flex-col md:flex-row">
        <aside className="hidden w-24 flex-shrink-0 flex-col items-center gap-6 border-r border-white/60 bg-white/70 py-8 backdrop-blur-md shadow-lg shadow-slate-900/5 dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20 md:flex relative z-40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/80 shadow-lg shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-slate-950/30">
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">CM</span>
          </div>
          <nav className="flex flex-col gap-4">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  console.log('Nav item clicked:', label);
                  setActiveNavItem(label);
                }}
                className={classNames(
                  "group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 backdrop-blur-md",
                  iosMotion.hoverButton,
                  iosMotion.focusRing,
                  activeNavItem === label
                    ? "bg-white text-slate-900 shadow-lg shadow-slate-900/10 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-950/30"
                    : "bg-white/40 text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-100"
                )}
              >
                <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-105" />
                <span
                  className={classNames(
                    "pointer-events-none absolute -right-28 rounded-full bg-slate-900/90 px-3 py-1 text-sm text-white opacity-0 shadow-lg dark:bg-slate-100/90 dark:text-slate-900 z-[9999]",
                    iosMotion.tooltip,
                    "group-hover:translate-x-1 group-hover:opacity-100"
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-4 py-4 backdrop-blur-md shadow-lg shadow-slate-900/5 dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20 md:px-8">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex flex-1 items-center rounded-full border border-white/60 bg-white/80 px-4 py-2 shadow-inner shadow-white/40 transition focus-within:border-white focus-within:ring-2 focus-within:ring-blue-200/60 focus-within:ring-offset-2 focus-within:ring-offset-white/70 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-950/30 dark:focus-within:ring-offset-slate-900">
                <MagnifyingGlassIcon className="mr-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="search"
                  placeholder="Quick search"
                  className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>
              <ThemeToggle className="hidden md:flex" />
              <button
                type="button"
                className={classNames(
                  "hidden h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-lg shadow-slate-900/10 hover:bg-white md:flex dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900",
                  iosMotion.hoverButton,
                  iosMotion.focusRing
                )}
              >
                <ShieldCheckIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </button>
              <button
                type="button"
                className={classNames(
                  "flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-lg shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200",
                  iosMotion.hoverButton,
                  iosMotion.focusRing
                )}
              >
                <UserCircleIcon className="h-8 w-8 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 md:pb-12">
            {activeNavItem === 'Clients' ? (
              clientView === 'detail' ? renderClientDetail() : renderClientManagement()
            ) : activeNavItem === 'Tasks' ? (
              renderTasksView()
            ) : activeNavItem === 'Settings' ? (
              renderSettingsView()
            ) : (
              <section className="space-y-8">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Dashboard
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    Hi, Noam, here is your day
                  </h1>
                </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className={classNames(
                      "flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20",
                      iosMotion.hoverCard,
                      iosMotion.focusRing
                    )}
                    tabIndex={0}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-inner shadow-white/60 dark:bg-slate-900/70 dark:shadow-slate-950/30">
                      <Icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions Section */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className={classNames(
                      "flex items-center gap-4 rounded-2xl border border-white/60 bg-gradient-to-r from-blue-50 to-blue-100/50 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all hover:from-blue-100 hover:to-blue-200/50 hover:shadow-xl dark:border-slate-800/60 dark:from-blue-950/30 dark:to-blue-900/20 dark:hover:from-blue-900/40 dark:hover:to-blue-800/30",
                      iosMotion.hoverCard,
                      iosMotion.focusRing
                    )}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/25">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Add New Client
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Create a new client profile
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setTaskCreationContext("tasks");
                      setSelectedDueDate("");
                      setShowCalendar(false);
                      setShowAddTaskModal(true);
                    }}
                    className={classNames(
                      "flex items-center gap-4 rounded-2xl border border-white/60 bg-gradient-to-r from-green-50 to-green-100/50 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-all hover:from-green-100 hover:to-green-200/50 hover:shadow-xl dark:border-slate-800/60 dark:from-green-950/30 dark:to-green-900/20 dark:hover:from-green-900/40 dark:hover:to-green-800/30",
                      iosMotion.hoverCard,
                      iosMotion.focusRing
                    )}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-500/25">
                      <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Add New Task
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Create a task for any client
                      </p>
                    </div>
                  </button>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20 xl:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Today’s tasks
                    </h2>
                    <button
                      type="button"
                      className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-900/10 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      View all
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {todaysTasks.length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Nothing due today. Great job staying ahead!
                      </p>
                    )}
                    {todaysTasks.map((task) => {
                      const client = clients.find((c) => c.id === task.clientId);
                      const isCompleted = task.status === "Done";
                      return (
                        <div
                          key={task.id}
                          className={classNames(
                            "flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20",
                            iosMotion.hoverCard
                          )}
                        >
                          <span
                            className={classNames(
                              "flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white/80 shadow-inner shadow-white/70 transition-all duration-200 ease-out dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-slate-950/30",
                              isCompleted
                                ? "border-green-300 bg-green-100 text-green-600"
                                : "text-transparent"
                            )}
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </span>
                          <div className="flex flex-1 flex-col">
                            <p
                              className={classNames(
                                "text-base font-medium text-slate-800 transition-colors duration-200 dark:text-slate-100",
                                isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""
                              )}
                            >
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                              <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/60 dark:text-slate-300">
                                {client?.name ?? "Unknown client"}
                              </span>
                              <span>{todayLabel(task.dueDate)}</span>
                              <span className="rounded-full bg-white/60 px-2 py-0.5 uppercase tracking-wide dark:bg-slate-900/50">
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          {!isCompleted && (
                            <button
                              type="button"
                              className={classNames(
                                "rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-lg shadow-slate-900/10 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900",
                                iosMotion.hoverButton,
                                iosMotion.focusRing
                              )}
                            >
                              Mark done
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Clients ({clients.length})
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fetchClients(0)}
                        disabled={isLoadingClients}
                        className="rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 shadow-lg shadow-slate-900/10 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900 disabled:opacity-50"
                        title="Refresh clients"
                      >
                        <svg className={`h-4 w-4 ${isLoadingClients ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-900/10 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        New client
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {isLoadingClients ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          <span>Loading clients...</span>
                        </div>
                      </div>
                    ) : clients.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500 dark:text-slate-400">No clients found</p>
                        <button
                          onClick={() => fetchClients(0)}
                          className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Refresh
                        </button>
                      </div>
                    ) : (
                      clients.map((client) => (
                      <article
                        key={client.id}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setActiveSection("overview");
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedClientId(client.id);
                            setActiveSection("overview");
                          }
                        }}
                        className={classNames(
                          "cursor-pointer rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20 dark:hover:shadow-slate-950/40",
                          client.id === selectedClientId &&
                            "border-blue-200 bg-white dark:border-blue-500/40 dark:bg-slate-900"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {client.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {client.company}
                            </p>
                          </div>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-sm text-slate-600 shadow-inner shadow-white/60 dark:bg-slate-900/70 dark:text-slate-200 dark:shadow-slate-950/30">
                            {
                              tasks.filter(
                                (task) => task.clientId === client.id && task.status !== "Done"
                              ).length
                            }{" "}
                            open
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {client.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </article>
                    )))}
                  </div>
                </section>
              </div>
            {selectedClient && (
              <section className="space-y-6 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {selectedClient.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedClient.company ?? "No company"} · {selectedClient.status}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-300">
                      {(selectedClient.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 px-3 py-1 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="inline-flex rounded-full border border-white/60 bg-white/80 p-1 shadow-inner shadow-white/60 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-950/30 relative z-20">
                    {(["overview", "tasks", "credentials", "activity"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          console.log('Tab clicked:', tab, 'Current active:', activeSection);
                          setActiveSection(tab);
                        }}
                        className="rounded-full px-4 py-2 text-sm font-medium capitalize transition bg-blue-200 hover:bg-blue-300 text-blue-900"
                        style={{
                          backgroundColor: activeSection === tab ? '#3b82f6' : '#dbeafe',
                          color: activeSection === tab ? 'white' : '#1e3a8a'
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {activeSection === "overview" && (
                    <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Open tasks</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                          {clientTasks.filter((task) => task.status !== "Done").length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Credentials on file
                        </p>
                        <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                          {clientCredentials.length}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === "tasks" && (
                    <div className="space-y-3">
                      {clientTasks.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No tasks for this client yet.
                        </p>
                      )}
                      {clientTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                {task.title}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {task.description ?? "No description"}
                              </p>
                            </div>
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                              {task.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                              {task.priority} priority
                            </span>
                            <span>Due {todayLabel(task.dueDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSection === "credentials" && (
                    <div className="space-y-3">
                      {clientCredentials.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No credentials stored for this client.
                        </p>
                      )}
                      {clientCredentials.map((credential) => (
                        <div
                          key={credential.id}
                          className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                              {credential.label}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                              <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/70">
                                {credential.username}
                              </span>
                              {credential.url && <span>{credential.url}</span>}
                            </div>
                          </div>
                          <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-sm tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-300">
                            {credential.maskedValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSection === "activity" && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Activity feed placeholder — connect audit events when backend is available.
                    </p>
                  )}
                </div>
              </section>
            )}
            </section>
            )}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-around gap-2 rounded-full border border-white/70 bg-white/80 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-slate-950/30 md:hidden">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              console.log('Bottom nav clicked:', label);
              setActiveNavItem(label);
            }}
            className={classNames(
              "flex flex-1 items-center justify-center rounded-full px-3 py-2 text-sm font-medium transition",
              iosMotion.hoverButton,
              iosMotion.focusRing,
              activeNavItem === label
                ? "bg-white text-slate-900 shadow-lg shadow-slate-900/10 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-950/30"
                : "text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-100"
            )}
          >
            <Icon className="mr-2 h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      
      {renderAddClientModal()}
      {renderAddTaskModal()}
      {renderAddCredentialModal()}
      {renderEditTaskModal()}
      {renderChangePasswordModal()}
    </div>
  );

  function renderChangePasswordModal() {
    if (!showChangePasswordModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/90">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            Change Password
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const currentPassword = formData.get('currentPassword') as string;
              const newPassword = formData.get('newPassword') as string;
              const confirmPassword = formData.get('confirmPassword') as string;
              
              if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
              }
              
              // Here you would typically call an API to change the password
              console.log('Password change requested');
              setShowChangePasswordModal(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Password *
              </label>
              <input
                name="currentPassword"
                type="password"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password *
              </label>
              <input
                name="newPassword"
                type="password"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password *
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-white/40 backdrop-blur-md placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Confirm new password"
              />
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800/60 dark:bg-yellow-900/20">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Password should be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="flex-1 rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-white/40 transition-all hover:bg-white dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};

export default DashboardLayout;
