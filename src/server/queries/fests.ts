import { db } from "@/db/client";
import { fests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export async function getPublishedFests() {
  return db
    .select()
    .from(fests)
    .where(eq(fests.status, "published"))
    .orderBy(desc(fests.startsAt));
}

export const getCachedPublishedFests = unstable_cache(
  async () => {
    return getPublishedFests();
  },
  ["published-fests"],
  {
    tags: ["fests"],
    revalidate: 3600,
  }
);

