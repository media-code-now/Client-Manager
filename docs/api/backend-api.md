# Backend API Design

## Technology Stack
- Node.js with Express + TypeScript
- PostgreSQL via Prisma (or equivalent ORM)
- JWT authentication (access + refresh tokens)
- AES-256-GCM encryption for credential secrets with keys sourced from KMS or environment secret

## Route Catalogue
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/sign-in` | Exchange email/password for JWT + refresh | Public |
| POST | `/auth/refresh` | Issue new access token | Refresh token |
| POST | `/auth/sign-out` | Invalidate refresh token | Bearer |
| GET | `/users/me` | Retrieve current user profile | Bearer |
| GET | `/clients` | Paginated clients with search/filter | Bearer |
| POST | `/clients` | Create client | Bearer (admin/manager) |
| GET | `/clients/:clientId` | Client detail | Bearer |
| PATCH | `/clients/:clientId` | Update client | Bearer (admin/manager) |
| POST | `/clients/:clientId/archive` | Archive client | Bearer (admin) |
| GET | `/clients/:clientId/tasks` | List tasks | Bearer |
| POST | `/clients/:clientId/tasks` | Create task | Bearer |
| PATCH | `/clients/:clientId/tasks/:taskId` | Update task | Bearer |
| DELETE | `/clients/:clientId/tasks/:taskId` | Delete task | Bearer (admin/manager) |
| GET | `/clients/:clientId/credentials` | List credential metadata | Bearer |
| POST | `/clients/:clientId/credentials` | Create encrypted credential | Bearer |
| GET | `/clients/:clientId/credentials/:credentialId` | Reveal credential (decrypt) | Bearer (admin/manager) |
| PATCH | `/clients/:clientId/credentials/:credentialId` | Update credential | Bearer |
| DELETE | `/clients/:clientId/credentials/:credentialId` | Delete credential | Bearer (admin) |
| GET | `/audit-logs` | List credential audit events | Bearer (admin) |

## Authentication & Authorisation Middleware
```ts
// middleware/auth.ts
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type Role = "admin" | "manager" | "read_only";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role: Role };
  }
}

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });

  const token = header.substring(7);
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as { sub: string; role: Role };
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (...allowed: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
};
```

## Client Management Example
```ts
// routes/clients.ts
import { Router } from "express";
import { authenticateJWT, requireRole } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();
router.use(authenticateJWT);

router.get("/", async (req, res) => {
  const { page = "1", pageSize = "20", q, status } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  const where = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q as string, mode: "insensitive" } },
              { company: { contains: q as string, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
      { archivedAt: null },
    ],
  };

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: parseInt(pageSize as string),
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count({ where }),
  ]);

  res.json({ items, total, page: parseInt(page as string) });
});

router.post("/", requireRole("admin", "manager"), async (req, res) => {
  const client = await prisma.client.create({
    data: { ...req.body, ownerUserId: req.user!.id },
  });
  res.status(201).json(client);
});

router.patch("/:clientId", requireRole("admin", "manager"), async (req, res) => {
  const client = await prisma.client.update({
    where: { id: req.params.clientId },
    data: req.body,
  });
  res.json(client);
});

router.post("/:clientId/archive", requireRole("admin"), async (req, res) => {
  await prisma.client.update({
    where: { id: req.params.clientId },
    data: { status: "archived", archivedAt: new Date() },
  });
  res.status(204).send();
});

export default router;
```

## Credential Encryption & Audit
```ts
// services/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY!, "base64"); // 32 bytes
const ALGO = "aes-256-gcm";

export function encryptSecret(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encryptedValue: Buffer.concat([encrypted, authTag]), nonce: iv };
}

export function decryptSecret(cipherPayload: Buffer, iv: Buffer) {
  const authTag = cipherPayload.subarray(cipherPayload.length - 16);
  const encrypted = cipherPayload.subarray(0, cipherPayload.length - 16);
  const decipher = createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
```

```ts
// routes/credentials.ts
router.get("/", async (req, res) => {
  const credentials = await prisma.credential.findMany({
    where: { clientId: req.params.clientId },
    select: {
      id: true,
      label: true,
      username: true,
      url: true,
      updatedAt: true,
      lastAccessedAt: true,
    },
  });
  res.json(credentials);
});

router.post("/", async (req, res) => {
  const { label, username, url, secret } = req.body;
  const { encryptedValue, nonce } = encryptSecret(secret);
  const credential = await prisma.credential.create({
    data: {
      clientId: req.params.clientId,
      label,
      username,
      url,
      encryptedValue,
      encryptionNonce: nonce,
      keyVersion: "v1",
      createdByUserId: req.user!.id,
      updatedByUserId: req.user!.id,
    },
  });
  await logAudit(credential.id, req.user!.id, "credential_create", req.ip, req.get("user-agent") ?? undefined);
  res.status(201).json({ id: credential.id });
});

router.get("/:credentialId", requireRole("admin", "manager"), async (req, res) => {
  const credential = await prisma.credential.findUniqueOrThrow({ where: { id: req.params.credentialId } });
  const secret = decryptSecret(credential.encryptedValue, credential.encryptionNonce);
  await logAudit(credential.id, req.user!.id, "credential_reveal", req.ip, req.get("user-agent") ?? undefined);
  await prisma.credential.update({
    where: { id: credential.id },
    data: { lastAccessedAt: new Date(), updatedByUserId: req.user!.id },
  });
  res.json({ id: credential.id, label: credential.label, username: credential.username, url: credential.url, secret });
});
```

## Audit Log Endpoint
```ts
router.get("/", authenticateJWT, requireRole("admin"), async (req, res) => {
  const { page = "1", pageSize = "50", credentialId, userId } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  const where = {
    credentialId: credentialId || undefined,
    userId: userId || undefined,
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: parseInt(pageSize as string),
      orderBy: { occurredAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        credential: { select: { label: true, clientId: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ items, total, page: parseInt(page as string) });
});
```

## Encryption Key Handling
- Store encryption keys outside the database (environment secret injected at runtime or managed KMS).
- Associate each credential with `key_version` to enable rotation.
- Decrypt only for authorised roles; wipe decrypted data from memory once response is sent.
- Log all reveal/update/delete operations to `audit_logs` with contextual metadata (ip, user agent).
