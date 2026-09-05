# Legacy Data Store (Unused)

This directory previously contained the flat-file user store (`users.json`) used during the Phase 0 MVP.

As of Phase 1 (Database Foundation):
- User data persistence has migrated to PostgreSQL managed via Prisma (`app/lib/prisma.ts` and `app/lib/users.ts`).
- `data/users.json` is marked as **LEGACY / UNUSED** and is retained only for historical reference or rollback.
- It is no longer read or modified by the authentication server actions or any other part of the application.
