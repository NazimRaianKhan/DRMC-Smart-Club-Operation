import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getEventsQuery } from "@/server/queries/events";
import { db } from "@/db/client";
import { fests, events } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Events Query Integration", () => {
  let festId: string;
  
  beforeAll(async () => {
    // We assume seed data is present. Let's find a fest to use.
    const festsData = await db.select().from(fests).limit(1);
    if (festsData.length > 0) {
      festId = festsData[0]!.id;
    }
  });

  it("should fetch events with default params", async () => {
    const result = await getEventsQuery({
      page: 1,
      pageSize: 10,
      when: "all",
      sort: "soonest",
      lang: "en",
    }, new Date());
    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should filter by category", async () => {
    const result = await getEventsQuery({
      category: "programming",
      page: 1,
      pageSize: 10,
      when: "all",
      sort: "soonest",
      lang: "en",
    }, new Date());
    
    result.items.forEach(e => {
      expect(e.category).toBe("programming");
    });
  });

  it("should filter by search query (trigram)", async () => {
    const eventList = await db.select().from(events).limit(1);
    if (eventList.length === 0) return;

    const testTitle = eventList[0]!.title.substring(0, 5); 
    
    const result = await getEventsQuery({
      q: testTitle,
      page: 1,
      pageSize: 10,
      when: "all",
      sort: "soonest",
      lang: "en",
    }, new Date());

    expect(result.items.length).toBeGreaterThan(0);
  });
  
  it("should filter by upcoming", async () => {
    const now = new Date();
    const result = await getEventsQuery({
      page: 1,
      pageSize: 10,
      when: "upcoming",
      sort: "soonest",
      lang: "en",
    }, now);
    
    result.items.forEach(e => {
      expect(e.startsAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });
});
