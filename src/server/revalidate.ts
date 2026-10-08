import { revalidateTag } from "next/cache";

/**
 * Revalidates cache tags associated with the directory (fests and events).
 * Call this after fests or events are created, updated, or deleted.
 */
export function revalidateCatalog() {
  // @ts-expect-error Next.js 15 type mismatch
  revalidateTag("fests");
  // @ts-expect-error Next.js 15 type mismatch
  revalidateTag("events");
}

