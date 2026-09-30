import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/Shared/ProductCard";
import { ProductCardSkeleton } from "@/components/Shared/Loader";
import FilterPanel, { FilterControls } from "@/components/Shared/SearchFilters";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFacetsQuery, useSearchProductsQuery } from "@/redux/api/productApi";
import { useAddToCart } from "@/hooks/useAddToCart";
import {
  GENDER_LABELS,
  LIST_KEYS,
  ListKey,
  SORT_OPTIONS,
  formatPrice,
  titleCase,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

const FILTER_KEYS = [...LIST_KEYS, "search", "minPrice", "maxPrice", "rating", "inStock"];

// Only forward keys the API knows, in a fixed order, so equal filters share one cache entry
const toQueryString = (params: URLSearchParams, keys: string[]) => {
  const out = new URLSearchParams();
  keys.forEach((key) => {
    const value = params.get(key);
    if (value) out.set(key, value);
  });
  return out.toString();
};

const pageNumbers = (page: number, total: number) => {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…", p] : [p]));
};

const Search = () => {
  const [params, setParams] = useSearchParams();
  const addToCart = useAddToCart();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getList = useCallback(
    (key: ListKey) => params.get(key)?.split(",").filter(Boolean) ?? [],
    [params]
  );

  // Functional update: always builds on the latest URL, even from debounced callbacks
  const setValues = useCallback(
    (changes: Record<string, string | null>, replace = false) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([key, value]) =>
            value ? next.set(key, value) : next.delete(key)
          );
          if (!("page" in changes)) next.delete("page");
          return next;
        },
        { replace }
      );
    },
    [setParams]
  );

  const toggleValue = useCallback(
    (key: ListKey, value: string) => {
      const current = getList(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setValues({ [key]: next.join(",") || null });
    },
    [getList, setValues]
  );

  const controls: FilterControls = { params, getList, toggleValue, setValues };

  const [term, setTerm] = useState(params.get("search") ?? "");
  const urlTerm = params.get("search") ?? "";
  // The last value this box wrote to the URL; only outside changes (chips, back button) overwrite typing
  const pushedTerm = useRef(urlTerm);

  useEffect(() => {
    if (urlTerm === pushedTerm.current) return;
    pushedTerm.current = urlTerm;
    setTerm(urlTerm);
  }, [urlTerm]);

  useEffect(() => {
    if (term.trim() === urlTerm) return;
    const timer = setTimeout(() => {
      pushedTerm.current = term.trim();
      setValues({ search: term.trim() || null }, true);
    }, 350);
    return () => clearTimeout(timer);
  }, [term, urlTerm, setValues]);

  const page = Math.max(1, Number(params.get("page")) || 1);
  const sortParam = params.get("sort");
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? sortParam! : "newest";
  const productQuery = toQueryString(params, [...FILTER_KEYS, "sort", "page"]);
  const facetQuery = toQueryString(params, FILTER_KEYS);

  const { data, isLoading, isFetching, isError, refetch } = useSearchProductsQuery(productQuery);
  const { data: facetData } = useFacetsQuery(facetQuery);
  const facets = facetData?.facets;

  // A stale link like ?page=9 after filters shrank the results: jump to the last real page
  useEffect(() => {
    if (data && data.totalPage > 0 && page > data.totalPage)
      setValues({ page: String(data.totalPage) }, true);
  }, [data, page, setValues]);

  const goToPage = (next: number) => {
    setValues({ page: next > 1 ? String(next) : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chips = useMemo(() => {
    const list: { id: string; label: string; remove: () => void }[] = [];
    const search = params.get("search");
    if (search)
      list.push({ id: "search", label: `“${search}”`, remove: () => setValues({ search: null }) });
    LIST_KEYS.forEach((key) =>
      getList(key).forEach((value) =>
        list.push({
          id: `${key}:${value}`,
          label:
            key === "gender"
              ? GENDER_LABELS[value] ?? value
              : key === "size"
              ? `Size ${value}`
              : titleCase(value),
          remove: () => toggleValue(key, value),
        })
      )
    );
    const min = params.get("minPrice");
    const max = params.get("maxPrice");
    if (min || max)
      list.push({
        id: "price",
        label: min && max ? `${formatPrice(+min)} – ${formatPrice(+max)}` : min ? `From ${formatPrice(+min)}` : `Up to ${formatPrice(+max!)}`,
        remove: () => setValues({ minPrice: null, maxPrice: null }),
      });
    const rating = params.get("rating");
    if (rating)
      list.push({ id: "rating", label: `${rating}★ & up`, remove: () => setValues({ rating: null }) });
    if (params.get("inStock") === "true")
      list.push({ id: "inStock", label: "In stock", remove: () => setValues({ inStock: null }) });
    return list;
  }, [params, getList, toggleValue, setValues]);

  const clearAll = () => setParams(sort !== "newest" ? { sort } : {});

  const genders = getList("gender");
  const categories = getList("category");
  const heading =
    [
      genders.length === 1 ? GENDER_LABELS[genders[0]] : "",
      categories.length === 1 ? titleCase(categories[0]) : "",
    ]
      .filter(Boolean)
      .join(" · ") || "All Products";

  const products = data?.products ?? [];
  const totalPage = data?.totalPage ?? 0;

  return (
    <div className="bg-white pb-20 pt-16">
      <header className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-150">Shop</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            {heading}
          </h1>
          <label className="relative mt-6 block max-w-2xl">
            <span className="sr-only">Search products</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search jeans, linen shirts, sneakers…"
              className="h-13 w-full rounded-full border border-stone-200 bg-white pl-12 pr-12 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 [&::-webkit-search-cancel-button]:hidden"
            />
            {term && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-20 hidden max-h-[calc(100vh-5rem)] w-64 shrink-0 overflow-y-auto pb-10 pt-4 lg:block" aria-label="Filters">
          <FilterPanel facets={facets} controls={controls} />
        </aside>

        <main className="min-w-0 flex-1 pt-6">
          <div className="sticky top-16 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-900 lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {chips.length > 0 && (
                    <span className="rounded-full bg-stone-900 px-1.5 text-[10px] leading-4 text-white">
                      {chips.length}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col p-0">
                <div className="border-b border-stone-200 px-5 py-4">
                  <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
                  <SheetDescription className="sr-only">
                    Narrow the product list by category, price, size and more.
                  </SheetDescription>
                </div>
                <div className="flex-1 overflow-y-auto px-5">
                  <FilterPanel facets={facets} controls={controls} />
                </div>
                <div className="flex gap-3 border-t border-stone-200 p-4">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex-1 rounded-full border border-stone-300 py-3 text-sm font-medium text-stone-900"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="flex-[2] rounded-full bg-stone-900 py-3 text-sm font-semibold text-white"
                  >
                    Show {data?.total ?? 0} results
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <p className="hidden text-sm text-stone-500 lg:block" aria-live="polite">
              {data ? `${data.total} product${data.total === 1 ? "" : "s"}` : " "}
            </p>

            <label className="relative flex items-center">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setValues({ sort: e.target.value === "newest" ? null : e.target.value })}
                className="appearance-none rounded-full border border-stone-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-stone-900 outline-none focus:border-stone-900"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-stone-500" />
            </label>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.remove}
                  aria-label={`Remove filter ${chip.label}`}
                  className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-800 transition-colors hover:bg-stone-200"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="px-2 text-xs font-medium text-stone-500 underline underline-offset-4 hover:text-stone-900"
              >
                Clear all
              </button>
            </div>
          )}

          <p className="mt-4 text-sm text-stone-500 lg:hidden" aria-live="polite">
            {data ? `${data.total} product${data.total === 1 ? "" : "s"}` : " "}
          </p>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <p className="text-lg font-semibold text-stone-900">We couldn't load products</p>
              <p className="mt-1 text-sm text-stone-500">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-6 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <SearchIcon className="h-7 w-7 text-stone-400" />
              </div>
              <p className="mt-5 text-lg font-semibold text-stone-900">No products match</p>
              <p className="mt-1 max-w-sm text-sm text-stone-500">
                Try removing a filter or searching for something else.
              </p>
              {chips.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-6 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "mt-6 grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity sm:grid-cols-3 xl:grid-cols-4",
                isFetching && "opacity-60"
              )}
              aria-busy={isFetching}
            >
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onQuickAdd={(p, size) => addToCart(p, size)}
                />
              ))}
            </div>
          )}

          {totalPage > 1 && products.length > 0 && (
            <nav className="mt-16 flex items-center justify-center gap-1" aria-label="Pagination">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
                className="rounded-full p-2 text-stone-700 hover:bg-stone-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {pageNumbers(page, totalPage).map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-2 text-stone-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p as number)}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      "h-10 min-w-10 rounded-full text-sm font-medium",
                      p === page ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPage}
                aria-label="Next page"
                className="rounded-full p-2 text-stone-700 hover:bg-stone-100 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
};

export default Search;
