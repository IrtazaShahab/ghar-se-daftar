import { AuthorizationError } from "@/lib/auth/guards";
import { describeDbError, isTransientDbError } from "@/lib/db/prisma";

/** Standard return value for admin/chef server actions used by ActionButton/ActionForm. */
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export function fromOperation(result: { ok: true } | { ok: false; error: string }, message?: string): ActionResult {
  return result.ok ? { ok: true, message } : result;
}

/** Converts thrown errors into a safe message; details are logged server-side only. */
export function actionError(error: unknown, context: string): ActionResult {
  if (error instanceof AuthorizationError) return { ok: false, error: error.message };
  if (isTransientDbError(error)) {
    console.error(`${context}: database unavailable (${describeDbError(error)})`);
    return { ok: false, error: "We couldn’t reach the database just now. Please refresh the page and try again." };
  }
  console.error(`${context}:`, error instanceof Error ? error.message : error);
  return { ok: false, error: "Something went wrong. Please try again." };
}
