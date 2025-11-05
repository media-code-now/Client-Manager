# Client Entity Specification

## Type Definition
```ts
type ClientStatus = "Active" | "Prospect" | "On hold" | "Archived";

type Client = {
  id: string;
  name: string;
  company?: string;
  primaryContactName: string;
  email: string;
  phone?: string;
  status: ClientStatus;
  tags: string[];
  timezone?: string;
  websiteUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  serviceFocus?: Array<"Web Development" | "SEO" | "Marketing">;
  referralSource?: string;
  billingRate?: number;
};
```

## Sample Data
```json
[
  {
    "id": "client-northwind",
    "name": "Northwind Co.",
    "company": "Northwind Co.",
    "primaryContactName": "Olivia Martin",
    "email": "olivia.martin@northwind.co",
    "phone": "+1 (555) 412-4433",
    "status": "Active",
    "tags": ["Enterprise", "Web Development", "Retainer"],
    "timezone": "America/Chicago",
    "websiteUrl": "https://northwind.co",
    "notes": "Weekly status call on Tuesdays; ongoing redesign & SEO retainer.",
    "createdAt": "2023-09-01T14:22:00.000Z",
    "updatedAt": "2024-05-30T10:04:00.000Z",
    "lastActivityAt": "2024-05-29T18:40:00.000Z",
    "serviceFocus": ["Web Development", "SEO"],
    "referralSource": "Existing agency partner",
    "billingRate": 145
  },
  {
    "id": "client-aperture",
    "name": "Aperture Labs",
    "company": "Aperture Labs",
    "primaryContactName": "Jackson Lee",
    "email": "jackson.lee@aperturelabs.io",
    "phone": "+1 (555) 204-1185",
    "status": "Prospect",
    "tags": ["Startup", "Marketing"],
    "timezone": "America/Los_Angeles",
    "websiteUrl": "https://aperturelabs.io",
    "notes": "Discovery call scheduled; interested in paid search and email automation.",
    "createdAt": "2024-05-15T16:10:00.000Z",
    "updatedAt": "2024-05-25T09:32:00.000Z",
    "lastActivityAt": "2024-05-24T21:15:00.000Z",
    "serviceFocus": ["Marketing"],
    "referralSource": "LinkedIn outreach"
  },
  {
    "id": "client-brightside",
    "name": "Brightside Studio",
    "company": "Brightside Studio",
    "primaryContactName": "Mia Thompson",
    "email": "mia@brightside.studio",
    "status": "On hold",
    "tags": ["Design Partner", "SEO"],
    "timezone": "America/New_York",
    "websiteUrl": "https://brightside.studio",
    "notes": "Pausing campaign until Q4 budget refresh; keep warm with monthly check-ins.",
    "createdAt": "2022-11-05T12:05:00.000Z",
    "updatedAt": "2024-04-18T14:20:00.000Z",
    "lastActivityAt": "2024-03-30T17:55:00.000Z",
    "serviceFocus": ["SEO", "Marketing"],
    "referralSource": "Word of mouth",
    "billingRate": 120
  }
]
```

## Field Notes
- `serviceFocus`: captures which services (web, SEO, marketing) the client buys—useful for planning workload.
- `referralSource`: highlights acquisition channels that work best.
- `billingRate`: quick reference for quoting additional work or checking retainer rates.
- `lastActivityAt`: allows sorting inactive accounts and scheduling follow-ups.
```
