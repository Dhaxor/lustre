import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma 7 config. Load .env.local (where Next.js keeps secrets) so the CLI
// (migrate/validate) sees the same DB URL the app uses. Migrations use the
// DIRECT (session-mode) connection; the runtime uses the pooled one.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DIRECT_URL") },
});
