import { randomInt } from "crypto";
import { Prisma } from "@prisma/client";

// No 0/O or 1/I/L, so references are easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  let code = "";
  for (let i = 0; i < length; i += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** e.g. GSD-7K3M9Q. Random (not sequential) so order numbers can't be enumerated. */
export function generateOrderNumber() {
  return `GSD-${randomCode(6)}`;
}

/** e.g. GSD-CR-4F8H2K for corporate requests. */
export function generateCorporateReference() {
  return `GSD-CR-${randomCode(6)}`;
}

/** e.g. GSD-Q-9TQ4M7 for corporate quotations. */
export function generateQuoteNumber() {
  return `GSD-Q-${randomCode(6)}`;
}

/** True when a unique-constraint error was raised on the given column. */
export function isUniqueViolationOn(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes(field) : typeof target === "string" && target.includes(field);
}

/** Retries `create` with a fresh reference when the random value collides. */
export async function withUniqueReference<T>(field: string, generate: () => string, create: (reference: string) => Promise<T>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await create(generate());
    } catch (error) {
      if (!isUniqueViolationOn(error, field)) throw error;
    }
  }
  throw new Error(`Could not generate a unique ${field}`);
}
