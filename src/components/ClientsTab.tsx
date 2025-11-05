'use client';

import { useEffect, useMemo, useState } from "react";

type ClientStatus = "Active" | "Prospect" | "On hold" | "Archived";

type Client = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  tags?: string[];
  timezone?: string;
  websiteUrl?: string;
  notes?: string;
  lastActivityAt?: string;
};

const mockClients: Client[] = [
  {
    id: "client-northwind",
    name: "Northwind Co.",
    company: "Northwind Co.",
    email: "olivia.martin@northwind.co",
    phone: "+1 (555) 412-4433",
    status: "Active",
    tags: ["Web Development", "SEO", "Retainer"],
    timezone: "America/Chicago",
    websiteUrl: "https://northwind.co",
    notes: "Weekly status call on Tuesdays; redesign + SEO retainer in progress.",
    lastActivityAt: "2024-05-29T18:40:00.000Z",
  },
  {
    id: "client-aperture",
    name: "Aperture Labs",
    company: "Aperture Labs",
    email: "jackson.lee@aperturelabs.io",
    phone: "+1 (555) 204-1185",
    status: "Prospect",
    tags: ["Marketing", "Paid Search"],
    timezone: "America/Los_Angeles",
    websiteUrl: "https://aperturelabs.io",
    notes: "Discovery call scheduled next week. Interested in paid search + email automation.",
    lastActivityAt: "2024-05-24T21:15:00.000Z",
  },
  {
    id: "client-brightside",
    name: "Brightside Studio",
    company: "Brightside Studio",
    email: "mia@brightside.studio",
    phone: "+1 (555) 301-2299",
    status: "On hold",
    tags: ["Design Partner", "SEO"],
    timezone: "America/New_York",
    websiteUrl: "https://brightside.studio",
    notes: "Campaign paused until Q4 budget refresh. Keep warm with monthly check-ins.",
    lastActivityAt: "2024-03-30T17:55:00.000Z",
  },
  {
    id: "client-orbit",
    name: "Orbit Analytics",
    company: "Orbit Analytics",
    email: "ava.chen@orbitanalytics.io",
    phone: "+1 (555) 830-5501",
    status: "Active",
    tags: ["Automation", "Analytics"],
    timezone: "America/Denver",
    websiteUrl: "https://orbitanalytics.io",
    notes: "Weekly automation updates; building GA4 dashboards.",
    lastActivityAt: "2024-05-18T11:42:00.000Z",
  },
];

const statuses: Array<"All" | ClientStatus> = ["All", "Active", "Prospect", "On hold", "Archived"];

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const formatRelativeDate = (iso?: string) => {
  if (!iso) return "No activity";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "Recently active";
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return minutes <= 1 ? "Active just now" : `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "Active yesterday" : `Active ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "Active 1 week ago" : `Active ${weeks} weeks ago`;
  return new Date(iso).toLocaleDateString();
};

const statusStyles: Record<ClientStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Prospect: "bg-sky-100 text-sky-700 border-sky-200",
  "On hold": "bg-amber-100 text-amber-700 border-amber-200",
  Archived: "bg-slate-100 text-slate-600 border-slate-200",
};

const ClientsTab = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ClientStatus>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery =
        query.length === 0 ||
        client.name.toLowerCase().includes(query) ||
        (client.company?.toLowerCase().includes(query) ?? false) ||
        (client.email?.toLowerCase().includes(query) ?? false);

      const matchesStatus = statusFilter === "All" || client.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-6 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-semibold text-slate-900">Clients</h1>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="flex min-w-[220px] flex-1 items-center rounded-full border border-white/60 bg-white px-4 py-2 shadow-inner shadow-white/60 focus-within:ring-2 focus-within:ring-blue-200/60">
                <svg
                  className="mr-3 h-5 w-5 text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0a7.5 7.5 0 1 0-10.607 0 7.5 7.5 0 0 0 10.607 0Z" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  placeholder="Search clients…"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {statuses.map((status) => {
                  const active = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={classNames(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        active
                          ? "border-blue-200 bg-white text-slate-900 shadow-sm"
                          : "border-transparent bg-white/60 text-slate-500 hover:bg-white/90"
                      )}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full border border-white/60 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              + New Client
            </button>
          </div>
        </header>

        <div className="flex gap-6">
          <aside className="flex w-full max-w-sm flex-col rounded-3xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-md">
            <div className="mb-3 text-sm text-slate-500">
              {filteredClients.length} client{filteredClients.length === 1 ? "" : "s"}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredClients.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500">
                  No clients match your filters.
                </div>
              )}
              {filteredClients.map((client) => {
                const isSelected = client.id === selectedClientId;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className={classNames(
                      "w-full rounded-2xl border border-transparent bg-white/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
                      isSelected && "border-blue-200 bg-white shadow-lg shadow-blue-100"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{client.name}</p>
                        <p className="text-sm text-slate-500">
                          {client.company ?? "No company listed"}
                        </p>
                      </div>
                      <span className={classNames("rounded-full border px-3 py-1 text-xs", statusStyles[client.status])}>
                        {client.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {(client.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/60 bg-white px-3 py-1 text-slate-600 shadow-inner shadow-white/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                      {isMounted ? formatRelativeDate(client.lastActivityAt) : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex-1 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-md">
            {!selectedClient ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                <svg
                  className="h-12 w-12 text-slate-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15m-15 4.5h15m-15 4.5H12" />
                </svg>
                <p className="text-lg font-semibold text-slate-600">Select a client</p>
                <p className="text-sm">Choose a client from the list to view their details.</p>
              </div>
            ) : (
              <ClientPreview client={selectedClient} isMounted={isMounted} />
            )}
          </section>
        </div>
      </div>
    </div>
      <NewClientModal
        isOpen={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSave={(payload) => {
          const id = `client-${Date.now()}`;
          const newClient: Client = {
            id,
            name: payload.name,
            company: payload.company,
            email: payload.email,
            phone: payload.phone,
            status: payload.status,
            tags: payload.tags,
            notes: payload.notes,
            lastActivityAt: new Date().toISOString(),
          };
          setClients((prev) => [newClient, ...prev]);
          setSelectedClientId(id);
          setIsModalOpen(false);
        }}
      />
  );
};

type InfoChipProps = {
  label: string;
  value: string;
};

const InfoChip = ({ label, value }: InfoChipProps) => (
  <div className="rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-slate-700">{value}</p>
  </div>
);

export default ClientsTab;

const ClientPreview = ({ client, isMounted }: { client: Client; isMounted: boolean }) => (
  <div className="flex h-full flex-col gap-6">
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{client.name}</h2>
          <p className="text-sm text-slate-500">
            {client.company ?? "No company"} • {client.email ?? "No email"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={classNames("rounded-full border px-3 py-1 text-xs", statusStyles[client.status])}>
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
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-white/60 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white/90">
            + Add Task
          </button>
          <button className="rounded-full border border-white/60 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white/90">
            + Add Credential
          </button>
          <button className="rounded-full border border-white/60 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white/90">
            Edit Client
          </button>
        </div>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      {client.phone && <InfoChip label="Phone" value={client.phone} />}
      {client.timezone && <InfoChip label="Timezone" value={client.timezone} />}
      {client.websiteUrl && <InfoChip label="Website" value={client.websiteUrl} />}
      <InfoChip label="Last activity" value={isMounted ? formatRelativeDate(client.lastActivityAt) : ""} />
    </div>

    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
        {client.notes ?? "No notes on file."}
      </p>
    </div>
  </div>
);

type NewClientModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (client: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    status: ClientStatus;
    tags?: string[];
    notes?: string;
  }) => void;
};

const NewClientModal = ({ isOpen, onCancel, onSave }: NewClientModalProps) => {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<ClientStatus>("Active");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
      tags:
        tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean) || undefined,
    });
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setStatus("Active");
    setTags("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">New client</h2>
          <button
            onClick={onCancel}
            className="rounded-full border border-white/60 bg-white px-3 py-1 text-sm text-slate-500 shadow-sm hover:bg-white/90"
          >
            Cancel
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Name*
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Company
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ClientStatus)}
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="Active">Active</option>
                <option value="Prospect">Prospect</option>
                <option value="On hold">On hold</option>
                <option value="Archived">Archived</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Tags
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Comma separated"
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-600">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-2xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/60 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-white/90"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
            >
              Save client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
