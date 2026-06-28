import bcryptjs from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a password for secure storage.
 * Server-side only. Never use in client components.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash.
 * Server-side only. Never use in client components.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}
