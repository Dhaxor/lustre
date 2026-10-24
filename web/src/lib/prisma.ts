import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 client via the Postgres driver adapter, using the pooled Supabase
// connection (DATABASE_URL). Singleton across serverless invocations / dev
// hot-reloads so we don't exhaust connections.
const g = globalThis as unknown as { __lustrePrisma?: PrismaClient };

function create(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = g.__lustrePrisma ?? (g.__lustrePrisma = create());

/** True when a database URL is configured (Phase-1 persistence is on). */
export function dbEnabled(): boolean {
  return !!process.env.DATABASE_URL;
}
