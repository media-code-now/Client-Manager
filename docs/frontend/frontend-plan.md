# Frontend Architecture & UX Plan

## Stack
- Next.js (App Router) with React 18
- Tailwind CSS for styling + motion utilities
- React Query for data fetching + caching
- JWT-based auth stored in secure storage (access token in memory / refresh in httpOnly cookie)
- Heroicons for iconography

## Routing & Component Tree
```
app/
  layout.tsx            -> wraps authenticated routes with <AppShell>
  (auth)/
    login/page.tsx      -> <LoginPage>
  dashboard/page.tsx    -> <DashboardPage>
  clients/[clientId]/page.tsx -> <ClientDetailPage>

components/
  AppShell/
    TopBar.tsx
    SidebarNav.tsx
  Dashboard/
    StatsRow.tsx
    ClientList.tsx
    TodayTasks.tsx
  ClientDetail/
    SegmentedTabs.tsx
    TaskList.tsx
    CredentialList.tsx
    ActivityFeed.tsx
  Modals/
    TaskModal.tsx
    CredentialModal.tsx
  Form/
    PasswordField.tsx
  Shared/
    FilterChips.tsx
    EmptyState.tsx
    Loader.tsx
    ErrorBanner.tsx
```

## Page Wireframes
### Login
- Centered translucent card on soft grey background.
- Fields: email, password, remember me toggle, CTA button.
- Security microcopy (“Passwords encrypted and protected.”).

### Dashboard
- Sticky top bar with greeting and search pill.
- Stats row (total clients, open tasks, overdue tasks, stored credentials).
- Main grid:
  - Clients panel: list of clients with company, tags, open tasks badge, link to detail.
  - Today’s Tasks panel: list of tasks with status pill, due date, client name.
- Floating “New Client” button (desktop) / bottom nav (mobile).

### Client Detail
- Hero header card with avatar initials, status pill, contact info, tags.
- Quick action buttons: Add Task, Add Credential.
- Segmented tabs (Tasks / Credentials / Activity).
  - Tasks: Reminders-style list, status pill, priority dot, due date, assigned user.
  - Credentials: masked secret chips, reveal button, metadata (username, URL), security note.
  - Activity: chronological log of task updates & credential audits.
- Modals for task/credential forms (rounded 3xl, glass effect).

## Key Components & Snippets
### Dashboard Page
```tsx
// app/dashboard/page.tsx
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data, isLoading } = useQuery(["dashboard"], api.getDashboardOverview);

  if (isLoading) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-20 flex flex-col gap-6 border-b border-white/60 bg-white/70 px-6 py-6 backdrop-blur-md shadow-lg shadow-slate-900/5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-900">Hi, Noam. Here’s your day.</h1>
        </div>
        <div className="flex w-full flex-1 items-center rounded-full border border-white/60 bg-white/80 px-4 py-2 shadow-inner shadow-white/40 focus-within:ring-2 focus-within:ring-blue-200/60 focus-within:ring-offset-2 focus-within:ring-offset-white/70 md:max-w-md">
          <input placeholder="Search clients or tasks" className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none" />
        </div>
      </header>

      <main className="px-6 pb-16 pt-8 md:px-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data?.stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 transition-all duration-200 ease-[cubic-bezier(0.24,0.68,0.5,1)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/12">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5">
            <header className="flex items-center justify-between">
              <h2 className="text-xl	font-semibold text-slate-900">Clients</h2>
              <button className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-white active:translate-y-px">
                New client
              </button>
            </header>
            <ul className="mt-4 divide-y divide-white/60">
              {data?.clients.map((client) => (
                <li key={client.id} className="group flex items-center justify-between gap-4 py-3">
                  <div>
                    <Link href={`/clients/${client.id}`} className="text-lg font-semibold text-slate-900 transition group-hover:text-blue-600">
                      {client.name}
                    </Link>
                    <p className="text-sm text-slate-500">{client.company}</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-sm text-slate-600 shadow-inner shadow-white/60">{client.openTasks} open</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5">
            <header className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Today’s Tasks</h2>
              <button className="text-sm font-medium text-blue-600 hover:underline">View all</button>
            </header>
            <ul className="mt-4 space-y-3">
              {data?.tasks.map((task) => (
                <li key={task.id} className="flex flex-col rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium text-slate-900">{task.title}</p>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">{task.status}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                    <span>{task.clientName}</span>
                    <span>{task.dueDate}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
```

### Client Detail Page
```tsx
// app/clients/[clientId]/page.tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import TaskModal from "@/components/TaskModal";
import CredentialModal from "@/components/CredentialModal";

const tabs = [
  { id: "tasks" as const, label: "Tasks" },
  { id: "credentials" as const, label: "Credentials" },
  { id: "activity" as const, label: "Activity" },
];

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const { data, isLoading } = useQuery(["client", params.clientId], () => api.getClientDetail(params.clientId));
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("tasks");
  const [taskOpen, setTaskOpen] = useState(false);
  const [credentialOpen, setCredentialOpen] = useState(false);

  if (isLoading || !data) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 pb-24 pt-6 md:px-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-lg shadow-slate-900/5 backdrop-blur-md">
          <!-- header content as shown earlier -->
        </header>
        {/* Tabbed content for tasks, credentials, activity */}
      </div>
      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} clientId={params.clientId} />
      <CredentialModal open={credentialOpen} onClose={() => setCredentialOpen(false)} clientId={params.clientId} />
    </div>
  );
}
```

### Credential Modal & Password Field
```tsx
function PasswordField() {
  const [reveal, setReveal] = useState(false);
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-slate-600">
        Secret
        <button type="button" onClick={() => setReveal((prev) => !prev)} className="text-blue-600 hover:underline">
          {reveal ? "Hide" : "Show"}
        </button>
      </label>
      <input
        name="secret"
        type={reveal ? "text" : "password"}
        placeholder="••••••••"
        className="mt-1 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <p className="mt-2 text-xs text-slate-500">Secrets are encrypted at rest. Every reveal is audited.</p>
    </div>
  );
}
```

## API Client
```ts
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
    },
    credentials: "include",
  });
  if (res.status === 401) {
    // trigger token refresh flow
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }
  return (await res.json()) as T;
}

export const api = {
  signIn: (payload: { email: string; password: string }) =>
    fetch(`${API_URL}/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => res.json()),
  getDashboardOverview: () => request("/dashboard"),
  getClientDetail: (clientId: string) => request(`/clients/${clientId}`),
  createTask: (clientId: string, payload: any) =>
    request(`/clients/${clientId}/tasks`, { method: "POST", body: JSON.stringify(payload) }),
  createCredential: (payload: { clientId: string; label: string; username?: string; secret: string; url?: string }) =>
    request(`/clients/${payload.clientId}/credentials`, { method: "POST", body: JSON.stringify(payload) }),
};
```

## Interaction Guidelines
- Use Tailwind transitions with cubic-bezier easing to mimic iOS springiness (`duration-200 ease-[cubic-bezier(0.24,0.68,0.5,1)]`).
- Hover states: slight lift (`hover:-translate-y-0.5`), shadow intensification, color shifts.
- Active states: `active:translate-y-px active:scale-[0.99]` for tactile feedback.
- Focus: `focus-visible:ring-2 focus-visible:ring-blue-300/60 focus-visible:ring-offset-2`.
- Modals animate from bottom using CSS transitions or Framer Motion `AnimatePresence`.

## Data Fetching Strategy
- Use React Query for caching; key by resource (`["client", clientId]`).
- Invalidate relevant queries after mutations (`createTask`, `createCredential`).
- Handle 401 by refreshing token and retrying request.

## Security & UX Notes
- Never expose decrypted secrets unless route returns them explicitly; ensure UI shows masked state by default.
- Display audit warnings when revealing secrets.
- Provide skeleton states for slow network scenarios, avoid jarring layout shifts.
