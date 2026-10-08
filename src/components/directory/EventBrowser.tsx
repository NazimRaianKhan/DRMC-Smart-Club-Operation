"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EventCard, CATEGORY_ICONS } from "./EventCard";
import { Input } from "@/components/ui/forms";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export function EventBrowser({ initialData, dict, lang, fests }: { initialData: any, dict: any, lang: string, fests: { slug: string, title: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [isLoading, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  
  const [q, setQ] = useState(searchParams.get("q") || "");
  
  const currentCategory = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const currentFest = searchParams.get("fest") || "";
  const currentState = searchParams.get("state")?.split(",").filter(Boolean) || [];
  const currentWhen = searchParams.get("when") || "upcoming";
  const currentSort = searchParams.get("sort") || "soonest";

  const fetchIdRef = useRef(0);

  useEffect(() => {
    // If URL has filters on initial load (other than default when=upcoming, sort=soonest), fetch them
    const sp = new URLSearchParams(searchParams.toString());
    const hasFilters = sp.has("q") || sp.has("category") || sp.has("fest") || sp.has("state") || sp.get("when") === "past" || sp.get("sort") !== "soonest" || sp.has("page");
    if (hasFilters) {
      // fetch initial
      fetchEvents(sp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async (query: URLSearchParams, append = false) => {
    setIsFetching(true);
    const fetchId = ++fetchIdRef.current;
    try {
      // Use no-store to ensure we get fresh state when clicking filters rapidly
      const res = await fetch(`/api/events?${query.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (fetchId === fetchIdRef.current) {
          setData((prev: any) => ({
            ...json.data,
            items: append ? [...prev.items, ...json.data.items] : json.data.items
          }));
        }
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsFetching(false);
      }
    }
  };

  const updateFilters = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // reset page
    newParams.delete("page");
    
    startTransition(() => {
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      fetchEvents(newParams);
    });
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateFilters("q", value.length >= 2 ? value : null);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
    debouncedSearch(e.target.value);
  };

  const clearSearch = () => {
    setQ("");
    updateFilters("q", null);
  };

  const toggleCategory = (cat: string) => {
    const newCats = currentCategory.includes(cat) ? currentCategory.filter(c => c !== cat) : [...currentCategory, cat];
    updateFilters("category", newCats.length > 0 ? newCats.join(",") : null);
  };

  const toggleState = (st: string) => {
    const newStates = currentState.includes(st) ? currentState.filter(s => s !== st) : [...currentState, st];
    updateFilters("state", newStates.length > 0 ? newStates.join(",") : null);
  };

  const loadMore = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", String(data.page + 1));
    startTransition(() => {
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      fetchEvents(newParams, true);
    });
  };

  const clearAllFilters = () => {
    setQ("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
      fetchEvents(new URLSearchParams());
    });
  };

  const showLoading = isLoading || isFetching;

  return (
    <div className="space-y-8">
      {/* Search & Filters */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
            <Input
              value={q}
              onChange={handleSearchChange}
              placeholder={dict.searchPlaceholder}
              className="pl-9 pr-9"
            />
            {q && (
              <button onClick={clearSearch} className="absolute right-3 top-3 text-text-muted hover:text-text">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <select 
            value={currentFest}
            onChange={(e) => updateFilters("fest", e.target.value || null)}
            className="h-10 rounded-md border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">{dict.allFests}</option>
            {fests.map(f => (
              <option key={f.slug} value={f.slug}>{f.title}</option>
            ))}
          </select>
          
          <select 
            value={currentSort}
            onChange={(e) => updateFilters("sort", e.target.value)}
            className="h-10 rounded-md border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="soonest">{dict.sortSoonest}</option>
            <option value="deadline">{dict.sortDeadline}</option>
            <option value="seats">{dict.sortSeats}</option>
          </select>

          <div className="flex border border-border rounded-md overflow-hidden h-10">
            <button 
              onClick={() => updateFilters("when", "upcoming")} 
              className={`px-4 text-sm font-medium transition-colors ${currentWhen === 'upcoming' ? 'bg-accent text-white' : 'bg-transparent hover:bg-surface-2'}`}
            >
              {dict.whenUpcoming}
            </button>
            <button 
              onClick={() => updateFilters("when", "past")} 
              className={`px-4 text-sm font-medium transition-colors ${currentWhen === 'past' ? 'bg-accent text-white' : 'bg-transparent hover:bg-surface-2'}`}
            >
              {dict.whenPast}
            </button>
          </div>

          <Button 
            onClick={clearAllFilters} 
            variant="secondary" 
            className="h-10 shrink-0"
            disabled={!q && currentCategory.length === 0 && !currentFest && currentState.length === 0 && currentWhen === 'upcoming' && currentSort === 'soonest'}
          >
            {dict.clearFilters || "Clear filters"}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">{dict.categoriesTitle}</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORY_ICONS).map(cat => {
              const Icon = CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS];
              const active = currentCategory.includes(cat);
              if (!Icon) return null;
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-accent text-white border-accent' : 'border-border bg-surface hover:bg-surface-2'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {dict.categories[cat]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">{dict.statesTitle}</p>
          <div className="flex flex-wrap gap-2">
            {['open', 'closing_soon', 'waitlist', 'full', 'closed'].map(st => {
              const active = currentState.includes(st);
              return (
                <button
                  key={st}
                  onClick={() => toggleState(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-accent text-white border-accent' : 'border-border bg-surface hover:bg-surface-2'}`}
                >
                  {dict.states[st]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite">
        {showLoading ? dict.loading : `${data.items.length} ${dict.resultsFound}`}
      </div>

      {/* Results Grid */}
      <div className={`transition-opacity duration-200 ${showLoading && data.page === 1 ? 'opacity-50 pointer-events-none' : ''}`}>
        {data.items.length === 0 ? (
          <div className="text-center py-16 px-4 border border-border border-dashed rounded-2xl">
            <h3 className="text-lg font-medium mb-2">{dict.noResults}</h3>
            <p className="text-text-muted mb-6">{dict.noResultsDesc}</p>
            <Button onClick={clearAllFilters} variant="secondary">{dict.clearFilters}</Button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {data.items.map((event: any, i: number) => (
                <motion.div
                  layout
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: (i % 12) * 0.05 }}
                >
                  <EventCard event={event} lang={lang} dict={dict} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {data.hasMore && (
        <div className="flex justify-center mt-8">
          <Button onClick={loadMore} disabled={showLoading} variant="secondary" className="min-w-[200px]">
            {showLoading ? dict.loading : dict.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}

