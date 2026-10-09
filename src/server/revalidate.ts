import { revalidateTag } from "next/cache";

/**
 * Revalidates cache tags associated with the directory (fests and events).
 * Call this after fests or events are created, updated, or deleted.
 */
export function revalidateCatalog() {
  //  Next.js 15 type mismatch
  revalidateTag("fests", 'max');
  //  Next.js 15 type mismatch
  revalidateTag("events", 'max');
}

