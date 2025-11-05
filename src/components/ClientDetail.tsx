'use client';

import { useMemo, useState } from "react";
import SegmentedControl from "./SegmentedControl";

type Client = {
  id: string;
  name: string;
  company?: string;
  status: "Active" | "On hold" | "Archived";
  email?: string;
  phone?: string;
  tags?: string[];
};

type Task = {
  id: string;
  clientId: string;
  title: string;
  status: "Open" | "In progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
};

type Credential = {
  id: string;
  clientId: string;
  label: string;
  username: string;
  maskedValue: string;
  url?: string;
};

type ActivityItem = {
  id: string;
  description: string;
  timestamp: string;
};

type ClientDetailProps = {
  client: Client;
  tasks: Task[];
  credentials: Credential[];
  activity: ActivityItem[];
};

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const formatDueLabel = (iso?: string) => {
  if (!iso) return "No due date";
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const target = date.toDateString();
  if (target === today.toDateString()) return "Today";
  if (target === tomorrow.toDateString()) return "Tomorrow";
  if (target === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
};

const ClientDetail = ({ client, tasks, credentials, activity }: ClientDetailProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "credentials" | "activity">(
    "tasks"
  );

  const openTaskCount = useMemo(
    () => tasks.filter((task) => task.status !== "Done").length,
    [tasks]
  );

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "tasks", label: "Tasks" },
      { id: "credentials", label: "Credentials" },
      { id: "activity", label: "Activity" },
    ],
    []
  );

  return (
    <section className="space-y-6 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{client.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {client.company ?? "No company"} · {client.status}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-300">
            {client.email && (
              <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/70">
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/70">
                {client.phone}
              </span>
            )}
            {(client.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <SegmentedControl options={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as typeof activeTab)} />
      </div>

      <div>
        {activeTab === "overview" && (
          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-wide text-slate-400">Open tasks</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {openTaskCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-wide text-slate-400">Credentials stored</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {credentials.length}
              </p>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-3">
            {tasks.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No tasks for this client yet.</p>
            )}
            {tasks.map((task) => (
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
                      {task.priority} priority
                    </p>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                    {task.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>Due {formatDueLabel(task.dueDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "credentials" && (
          <div className="space-y-3">
            {credentials.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No credentials stored for this client.
              </p>
            )}
            {credentials.map((credential) => (
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

        {activeTab === "activity" && (
          <div className="space-y-3">
            {activity.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
            )}
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60"
              >
                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-400" />
                <div>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{item.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ClientDetail;
