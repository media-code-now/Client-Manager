import type { AuditEvent, Client, Credential, Task } from "../types/crm";

export const mockClients: Client[] = [
  {
    id: "client-1",
    name: "Olivia Martin",
    company: "Northwind Co.",
    status: "Active",
    email: "olivia.martin@northwind.co",
    phone: "+1 (555) 412-4433",
    tags: ["VIP", "Legal"],
    notes:
      "Key enterprise client. Requires weekly status updates and quarterly business reviews.",
  },
  {
    id: "client-2",
    name: "Jackson Lee",
    company: "Aperture Labs",
    status: "On hold",
    email: "jackson.lee@aperturelabs.io",
    phone: "+1 (555) 204-1185",
    tags: ["Finance"],
  },
  {
    id: "client-3",
    name: "Mia Thompson",
    company: "Brightside Studio",
    status: "Active",
    email: "mia@brightside.studio",
    phone: "+1 (555) 730-2299",
    tags: ["Design", "Partner"],
    notes: "Collaborative design partner with bi-weekly deliverables.",
  },
  {
    id: "client-4",
    name: "Ava Chen",
    company: "Orbit Analytics",
    status: "Active",
    email: "ava.chen@orbitanalytics.io",
    phone: "+1 (555) 830-5501",
    tags: ["Onboarding"],
  },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const iso = (date: Date) => date.toISOString();

export const mockTasks: Task[] = [
  {
    id: "task-1",
    clientId: "client-1",
    title: "Prepare onboarding packet",
    description: "Compile documents for new security admin hire.",
    status: "in-progress",
    priority: "high",
    dueDate: iso(today),
    assignedTo: "Noam",
    createdAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3)),
  },
  {
    id: "task-2",
    clientId: "client-2",
    title: "Review contract revisions",
    description: "Legal review for updated SLAs.",
    status: "open",
    priority: "medium",
    dueDate: iso(today),
    assignedTo: "Chris",
    createdAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2)),
  },
  {
    id: "task-3",
    clientId: "client-4",
    title: "Send credentials update",
    status: "open",
    priority: "low",
    dueDate: iso(tomorrow),
    assignedTo: "Lina",
    createdAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24)),
  },
  {
    id: "task-4",
    clientId: "client-3",
    title: "Schedule Q3 planning",
    status: "completed",
    priority: "medium",
    dueDate: iso(yesterday),
    completedAt: iso(today),
    assignedTo: "Noam",
    createdAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5)),
  },
  {
    id: "task-5",
    clientId: "client-1",
    title: "Deliver security assessment",
    description: "Finalize pen-test summary and recommendations.",
    status: "open",
    priority: "high",
    dueDate: iso(new Date(today.getTime() + 1000 * 60 * 60 * 24 * 3)),
    assignedTo: "Alex",
    createdAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 1.5)),
  },
];

export const mockCredentials: Credential[] = [
  {
    id: "cred-1",
    clientId: "client-1",
    label: "Northwind Admin Portal",
    username: "olivia.martin",
    url: "https://portal.northwind.co",
    secret: "nw-portal-8842",
    lastUpdated: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 6)),
  },
  {
    id: "cred-2",
    clientId: "client-1",
    label: "Legal Docs S3",
    username: "northwind-ops",
    url: "https://aws.amazon.com",
    secret: "aws-secret-2030",
    lastUpdated: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 15)),
    notes: "Rotate every 90 days.",
  },
  {
    id: "cred-3",
    clientId: "client-3",
    label: "Design Feedback Hub",
    username: "mia.t",
    url: "https://feedback.brightside.studio",
    secret: "bright-9912",
    lastUpdated: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2)),
  },
  {
    id: "cred-4",
    clientId: "client-4",
    label: "Orbit API Key",
    username: "orbit-service",
    secret: "orbit-api-44d9",
    lastUpdated: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 20)),
  },
];

export const mockAuditEvents: AuditEvent[] = [
  {
    id: "audit-1",
    clientId: "client-1",
    credentialId: "cred-1",
    actor: "Noam Sadi",
    description: "Revealed Northwind Admin Portal credential.",
    timestamp: iso(new Date(today.getTime() - 1000 * 60 * 45)),
  },
  {
    id: "audit-2",
    clientId: "client-1",
    credentialId: "cred-2",
    actor: "Noam Sadi",
    description: "Updated S3 credential notes.",
    timestamp: iso(new Date(today.getTime() - 1000 * 60 * 60 * 5)),
  },
  {
    id: "audit-3",
    clientId: "client-4",
    credentialId: "cred-4",
    actor: "Chris Gardner",
    description: "Copied Orbit API Key.",
    timestamp: iso(new Date(today.getTime() - 1000 * 60 * 60 * 12)),
  },
  {
    id: "audit-4",
    clientId: "client-3",
    actor: "System",
    description: "Completed quarterly security assessment task.",
    timestamp: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2)),
  },
];
