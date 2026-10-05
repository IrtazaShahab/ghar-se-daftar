import { Prisma, PrismaClient } from "@prisma/client";

/**
 * The one Prisma client for the whole app (server code only).
 *
 * Connection model (Supabase + Prisma 5):
 *   DATABASE_URL → runtime queries. Production/Vercel: Supavisor *transaction*
 *                  pooler (port 6543). Locally either pooler works.
 *   DIRECT_URL   → Prisma CLI only (schema.prisma `directUrl`).
 *
 * Supavisor's session pooler admits only `pool_size` clients (15 on this
 * project), and Prisma's default pool is 2 × CPUs + 1 connections, which is 17
 * on an 8-core laptop. That overflow caused the intermittent P1001 errors, so a
 * small connection_limit is applied unless the URL sets one.
 */

const TRANSACTION_POOLER_PORT = "6543";

function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined; // Prisma raises its usual "Environment variable not found" error.

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  // Transaction pooling can't keep prepared statements between queries.
  if (url.port === TRANSACTION_POOLER_PORT && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }
  if (!url.searchParams.has("connection_limit")) {
    // Serverless: one connection per function instance (Supabase/Prisma guidance).
    // Development: a few, leaving room under the pooler cap for CLI tools.
    url.searchParams.set("connection_limit", process.env.NODE_ENV === "production" ? "1" : "5");
  }
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "10");
  return url.toString();
}

/** Connection-level failures that are worth one quick retry (never logic or constraint errors). */
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

export function isTransientDbError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError && TRANSIENT_CODES.has(error.code)) return true;
  if (error instanceof Prisma.PrismaClientUnknownRequestError || error instanceof Prisma.PrismaClientRustPanicError) {
    return /EMAXCONN|max clients reached|Can't reach database|Connection (?:reset|refused|terminated)|timed out/i.test(error.message);
  }
  return false;
}

/** Short, safe description for server logs: error code only, never host names or URLs. */
export function describeDbError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  if (error instanceof Prisma.PrismaClientInitializationError) return error.errorCode ?? "init";
  if (error instanceof Error) return error.name;
  return "unknown";
}

// Reads are safe to repeat; writes are never retried here (order creation has
// its own idempotency key, everything else would risk applying twice).
const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "$queryRaw"
]);

function createClient() {
  const base = new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

  return base.$extends({
    name: "transient-read-retry",
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!READ_OPERATIONS.has(operation) || !isTransientDbError(error)) throw error;
          console.warn(`[db] ${model ?? "raw"}.${operation} failed (${describeDbError(error)}); retrying once`);
          await new Promise((resolve) => setTimeout(resolve, 300));
          return query(args);
        }
      }
    }
  });
}

type AppPrismaClient = ReturnType<typeof createClient>;

// One client per process. In development, Next.js re-evaluates modules on hot
// reload; keeping the client on globalThis stops each reload opening a new pool.
const globalForPrisma = globalThis as unknown as { prisma?: AppPrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
