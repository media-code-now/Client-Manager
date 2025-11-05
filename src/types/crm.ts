export type ClientStatus = "Active" | "Prospect" | "On hold" | "Archived";

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  status: ClientStatus;
  tags?: string[];
  timezone?: string;
  websiteUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export const mockClients: Client[] = [
  {
    id: "client-northwind",
    name: "Northwind Co.",
    company: "Northwind Co.",
    email: "hello@northwind.co",
    phone: "+1 (555) 412-4433",
    status: "Active",
    tags: ["Web Development", "SEO", "Retainer"],
    timezone: "America/Chicago",
    websiteUrl: "https://northwind.co",
    notes: "Weekly status call on Tuesdays; redesign + SEO retainer in progress.",
    createdAt: "2023-09-01T14:22:00.000Z",
    updatedAt: "2024-05-30T10:04:00.000Z",
    lastActivityAt: "2024-05-29T18:40:00.000Z",
  },
  {
    id: "client-aperture",
    name: "Aperture Labs",
    company: "Aperture Labs",
    email: "contact@aperturelabs.io",
    phone: "+1 (555) 204-1185",
    status: "Prospect",
    tags: ["Marketing", "Paid Search"],
    timezone: "America/Los_Angeles",
    websiteUrl: "https://aperturelabs.io",
    notes: "Discovery call scheduled next week. Interested in paid search + email automation.",
    createdAt: "2024-05-15T16:10:00.000Z",
    updatedAt: "2024-05-25T09:32:00.000Z",
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
    createdAt: "2022-11-05T12:05:00.000Z",
    updatedAt: "2024-04-18T14:20:00.000Z",
    lastActivityAt: "2024-03-30T17:55:00.000Z",
  },
];

export type TaskStatus = "open" | "in-progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // ISO string
  assignedTo?: string;
  createdAt: string;
  completedAt?: string | null;
};

export type Credential = {
  id: string;
  clientId: string;
  label: string;
  username: string;
  url?: string;
  secret: string;
  notes?: string;
  lastUpdated: string;
};

export type AuditEvent = {
  id: string;
  clientId: string;
  credentialId?: string;
  actor: string;
  description: string;
  timestamp: string;
};
