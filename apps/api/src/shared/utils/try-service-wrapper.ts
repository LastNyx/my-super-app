// shared/utils/tryService.ts
import { HttpError } from "./errors";
import { Prisma } from "../../../generated/prisma/client";

/**
 * Wrap a service function to handle DB and unknown errors consistently.
 */
export const tryService = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    // 🧩 Handle Prisma Known Errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case "P2002":
          // Unique constraint
          throw new HttpError(409, "Duplicate entry");
        case "P2003":
          // Foreign key constraint
          throw new HttpError(400, "Invalid reference (foreign key)");
        case "P2025":
          // Record not found
          throw new HttpError(404, "Record not found");
        default:
          throw new HttpError(500, `Database error: ${err.code}`, err.meta);
      }
    }

    // 🧩 Handle Prisma Validation / Initialization / Other Errors
    if (err instanceof Prisma.PrismaClientValidationError) {
      throw new HttpError(400, "Invalid Prisma query");
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
      throw new HttpError(500, "Database initialization error");
    }

    // 🧩 Handle pre-thrown HttpError
    if (err instanceof HttpError) throw err;

    // 🧩 Unexpected errors — log and rethrow
    console.error("Unexpected service error:", err);
    throw new HttpError(500, "Internal Server Error", err?.message);
  }
};
