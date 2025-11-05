'use client';

import type { FC } from "react";

type ClientStatus = "Active" | "Prospect" | "On hold" | "Archived";

type Client = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  tags?: string[];
  websiteUrl?: string;
  notes?: string;
};

type Task = {
  id: string;
  title: string;
  status: "Open" | "In progress" | "Done";
};

type Credential = {
  id: string;
  label: string;
  maskedValue: string;
};

type ClientPreviewPanelProps = {
  client: Client;
  tasks: Task[];
  credentials: Credential[];
};

const statusStyles: Record<ClientStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Prospect: "bg-sky-100 text-sky-700 border-sky-200",
  "On hold": "bg-amber-100 text-amber-700 border-amber-200",
  Archived: "bg-slate-100 text-slate-600 border-slate-200",
};

const ClientPreviewPanel: FC<ClientPreviewPanelProps> = ({ client, tasks, credentials }) => {
  const recentTasks = tasks.slice(0, 5);
  const recentCredentials = credentials.slice(0, 5);

  return (
    <div className="flex h-full flex-col gap-6 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md">
      {/* Header */}
      <div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{client.name}</h2>
            <p className="text-sm text-slate-500">{client.company ?? "No company listed"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  statusStyles[client.status],
                ].join(" ")}
              >
                {client.status}
              </span>
              {(client.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/60 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2 text-sm text-slate-600">
            {client.email && (
              <span className="rounded-full border border-white/60 bg-white px-4 py-2 shadow-inner shadow-white/60">
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="rounded-full border border-white/60 bg-white px-4 py-2 shadow-inner shadow-white/60">
                {client.phone}
              </span>
            )}
            {client.websiteUrl && (
              <a
                href={client.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/60 bg-white px-4 py-2 text-blue-600 shadow-inner shadow-white/60 hover:underline"
              >
                {client.websiteUrl}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Recent tasks</h3>
          <span className="text-xs text-slate-400">
            Showing {recentTasks.length} of {tasks.length}
          </span>
        </div>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-white/60 bg-white px-4 py-3 text-sm shadow-inner shadow-white/60"
              >
                <span className="text-slate-700">{task.title}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-500">
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Credentials */}
      <div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Credentials</h3>
          <span className="text-xs text-slate-400">
            Showing {recentCredentials.length} of {credentials.length}
          </span>
        </div>
        {recentCredentials.length === 0 ? (
          <p className="text-sm text-slate-500">No credentials stored.</p>
        ) : (
          <ul className="space-y-2">
            {recentCredentials.map((credential) => (
              <li
                key={credential.id}
                className="flex items-center justify-between rounded-xl border border-white/60 bg-white px-4 py-3 text-sm shadow-inner shadow-white/60"
              >
                <div>
                  <p className="text-slate-700">{credential.label}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs tracking-wide text-slate-500">
                  {credential.maskedValue}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
          {client.notes ?? "No notes on file."}
        </p>
      </div>
    </div>
  );
};

export default ClientPreviewPanel;
