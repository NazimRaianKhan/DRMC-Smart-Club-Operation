"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EventCard, CATEGORY_ICONS } from "./EventCard";
import { Input } from "@/components/ui/forms";
import { Button } from "@/components/ui/button";
import { Search, X, Sparkles } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export function EventBrowser({ initialData, dict, lang, fests }: { initialData: any, dict: any, lang: string, fests: { slug: string, title: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [isLoading, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  const [q, setQ] = useState(searchParams.get("q") || "");
  
  const currentCategory = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const currentFest = searchParams.get("fest") || "";
  const currentState = searchParams.get("state")?.split(",").filter(Boolean) || [];
  const currentWhen = searchParams.get("when") || "upcoming";
  const currentSort = searchParams.get("sort") || "soonest";

  const fetchIdRef = useRef(0);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    const hasFilters = sp.has("q") || sp.has("category") || sp.has("fest") || sp.has("state") || sp.get("when") === "past" || sp.get("sort") !== "soonest" || sp.has("page");
    if (hasFilters) {
      fetchEvents(sp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async (query: URLSearchParams, append = false) => {
    setIsFetching(true);
    const fetchId = ++fetchIdRef.current;
    setAiSummary(null);
    try {
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

  const fetchAiEvents = async (queryText: string) => {
    setIsFetching(true);
    const fetchId = ++fetchIdRef.current;
    try {
      const res = await fetch(`/api/ai/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, lang })
      });
      if (res.ok) {
        const json = await res.json();
        if (fetchId === fetchIdRef.current) {
          setData(json.data);
          setAiSummary(json.summary);
          
          // Optionally update URL parameters based on AI returned filters
          if (json.filters) {
            const newParams = new URLSearchParams();
            if (json.filters.q) newParams.set("q", json.filters.q);
            if (json.filters.category) newParams.set("category", json.filters.category);
            if (json.filters.state) newParams.set("state", json.filters.state);
            router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
          }
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
    if (value === null) newParams.delete(key);
    else newParams.set(key, value);
    newParams.delete("page");
    
    startTransition(() => {
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      fetchEvents(newParams);
    });
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (!isAiMode) {
      updateFilters("q", value.length >= 2 ? value : null);
    }
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
    if (!isAiMode) {
      debouncedSearch(e.target.value);
    }
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAiMode && q.length >= 2) {
      fetchAiEvents(q);
    }
  };

  const clearSearch = () => {
    setQ("");
    setAiSummary(null);
    if (!isAiMode) {
      updateFilters("q", null);
    } else {
      fetchEvents(new URLSearchParams());
    }
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
    setAiSummary(null);
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
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <button 
            type="button"
            onClick={() => setIsAiMode(!isAiMode)}
            className={`shrink-0 flex items-center gap-2 px-4 h-10 rounded-full font-medium transition-colors border ${isAiMode ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-surface hover:bg-surface-2 border-border'}`}
          >
            <Sparkles className="w-4 h-4" />
            {isAiMode ? "AI Mode: ON" : "Ask AI"}
          </button>

          <form onSubmit={handleAiSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
            <Input
              value={q}
              onChange={handleSearchChange}
              placeholder={isAiMode ? (lang === 'bn' ? "AI  __... (:  _  )" : "Ask AI... (e.g., Are there any open programming contests next week?)") : dict.searchPlaceholder}
              className={`pl-9 pr-9 ${isAiMode ? 'border-indigo-500/50 focus-visible:ring-indigo-500' : ''}`}
            />
            {q && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-3 text-text-muted hover:text-text">
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
          
          {!isAiMode && (
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
          )}
          
          {!isAiMode && (
            <select 
              value={currentSort}
              onChange={(e) => updateFilters("sort", e.target.value)}
              className="h-10 rounded-md border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="soonest">{dict.sortSoonest}</option>
              <option value="deadline">{dict.sortDeadline}</option>
              <option value="seats">{dict.sortSeats}</option>
            </select>
          )}

          {!isAiMode && (
            <div className="flex border border-border rounded-md overflow-hidden h-10 shrink-0">
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
          )}

          {!isAiMode && (
            <Button 
              onClick={clearAllFilters} 
              variant="secondary" 
              className="h-10 shrink-0"
              disabled={!q && currentCategory.length === 0 && !currentFest && currentState.length === 0 && currentWhen === 'upcoming' && currentSort === 'soonest'}
            >
              {dict.clearFilters || "Clear filters"}
            </Button>
          )}
        </div>

        {!isAiMode && (
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
        )}

        {!isAiMode && (
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
        )}

        {aiSummary && (
          <div className="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span><strong>{lang === 'bn' ? 'AI _:' : 'AI understood:'}</strong> {aiSummary}</span>
          </div>
        )}
      </div>

      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite">
        {showLoading ? dict.loading : `${data?.items?.length || 0} ${dict.resultsFound}`}
      </div>

      {/* Results Grid */}
      <div className={`transition-opacity duration-200 ${showLoading && (!data || data.page === 1) ? 'opacity-50 pointer-events-none' : ''}`}>
        {!data || data.items.length === 0 ? (
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

      {data && data.hasMore && (
        <div className="flex justify-center mt-8">
          <Button onClick={loadMore} disabled={showLoading} variant="secondary" className="min-w-[200px]">
            {showLoading ? dict.loading : dict.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
