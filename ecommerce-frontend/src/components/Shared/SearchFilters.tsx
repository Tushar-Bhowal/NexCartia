import { ReactNode, useEffect, useState } from "react";
import { Check, ChevronDown, Star } from "lucide-react";
import { Facets, FacetOption } from "@/types/types";
import {
  COLORS,
  GENDER_LABELS,
  ListKey,
  SIZE_GROUPS,
  formatPrice,
  titleCase,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

export type FilterControls = {
  params: URLSearchParams;
  getList: (key: ListKey) => string[];
  toggleValue: (key: ListKey, value: string) => void;
  setValues: (changes: Record<string, string | null>, replace?: boolean) => void;
};

// Keep selected values visible even when the other filters leave them with 0 matches,
// otherwise they could never be unticked from the panel.
const withSelected = (options: FacetOption[] = [], selected: string[]) => [
  ...options,
  ...selected
    .filter((value) => !options.some((o) => o.value === value))
    .map((value) => ({ value, count: 0 })),
];

const Section = ({
  title,
  children,
  defaultOpen = true,
  activeCount = 0,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
}) => (
  <details open={defaultOpen} className="group/section border-b border-stone-200 py-4">
    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
      <span className="flex items-center gap-2">
        {title}
        {activeCount > 0 && (
          <span className="rounded-full bg-stone-900 px-1.5 text-[10px] leading-4 text-white">
            {activeCount}
          </span>
        )}
      </span>
      <ChevronDown className="h-4 w-4 text-stone-500 transition-transform group-open/section:rotate-180" />
    </summary>
    <div className="mt-3">{children}</div>
  </details>
);

const Count = ({ value }: { value: number }) => (
  <span className="ml-auto text-xs tabular-nums text-stone-500">{value}</span>
);

const PriceRange = ({
  bounds,
  params,
  setValues,
}: {
  bounds: { min: number; max: number };
  params: URLSearchParams;
  setValues: FilterControls["setValues"];
}) => {
  const floor = Math.floor(bounds.min / 100) * 100;
  const ceil = Math.max(floor + 100, Math.ceil(bounds.max / 100) * 100);
  const urlMin = Number(params.get("minPrice") ?? floor);
  const urlMax = Number(params.get("maxPrice") ?? ceil);

  const [range, setRange] = useState<[number, number]>([urlMin, urlMax]);

  // Follow the URL when it changes elsewhere (chip removed, "Clear all", back button)
  useEffect(() => {
    setRange([urlMin, urlMax]);
  }, [urlMin, urlMax]);

  useEffect(() => {
    if (range[0] === urlMin && range[1] === urlMax) return;
    const timer = setTimeout(() => {
      setValues(
        {
          minPrice: range[0] > floor ? String(range[0]) : null,
          maxPrice: range[1] < ceil ? String(range[1]) : null,
        },
        true
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [range, urlMin, urlMax, floor, ceil, setValues]);

  const [low, high] = range;
  const [drafts, setDrafts] = useState<[string, string] | null>(null);

  // Typed prices are committed on blur/Enter, clamped to the bounds and never inverted
  const commitDraft = (i: 0 | 1) => {
    if (!drafts) return;
    const typed = Number(drafts[i]);
    const value = Number.isFinite(typed) && drafts[i] !== "" ? typed : i === 0 ? floor : ceil;
    setRange(
      i === 0
        ? [Math.min(Math.max(value, floor), high - 100), high]
        : [low, Math.max(Math.min(value, ceil), low + 100)]
    );
    setDrafts(null);
  };

  const pct = (v: number) => ((Math.min(Math.max(v, floor), ceil) - floor) / (ceil - floor)) * 100;

  return (
    <div>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-stone-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-stone-900"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          type="range"
          aria-label="Minimum price"
          className="dual-range"
          min={floor}
          max={ceil}
          step={100}
          value={Math.min(low, ceil)}
          onChange={(e) => setRange([Math.min(Number(e.target.value), high - 100), high])}
        />
        <input
          type="range"
          aria-label="Maximum price"
          className="dual-range"
          min={floor}
          max={ceil}
          step={100}
          value={Math.max(high, floor)}
          onChange={(e) => setRange([low, Math.max(Number(e.target.value), low + 100)])}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        {(["Min", "Max"] as const).map((label, i) => (
          <label
            key={label}
            className="flex flex-1 items-center rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus-within:border-stone-900"
          >
            <span className="mr-1 text-stone-400">₹</span>
            <span className="sr-only">{label}imum price</span>
            <input
              type="number"
              inputMode="numeric"
              min={floor}
              max={ceil}
              value={drafts ? drafts[i] : range[i]}
              onChange={(e) => {
                const next: [string, string] = drafts ?? [String(low), String(high)];
                next[i] = e.target.value;
                setDrafts([next[0], next[1]]);
              }}
              onBlur={() => commitDraft(i as 0 | 1)}
              onKeyDown={(e) => e.key === "Enter" && commitDraft(i as 0 | 1)}
              className="w-full bg-transparent tabular-nums outline-none"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {formatPrice(floor)} – {formatPrice(ceil)}
      </p>
    </div>
  );
};

const FilterPanel = ({
  facets,
  controls,
}: {
  facets?: Facets;
  controls: FilterControls;
}) => {
  const { params, getList, toggleValue, setValues } = controls;
  const selectedCategories = getList("category");
  const selectedGenders = getList("gender");
  const selectedSizes = getList("size");
  const selectedFits = getList("fit");
  const selectedColors = getList("color");
  const minRating = Number(params.get("rating") ?? 0);
  const inStock = params.get("inStock") === "true";

  if (!facets)
    return (
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-stone-100" />
        ))}
      </div>
    );

  const sizeOptions = withSelected(facets.sizes, selectedSizes);

  return (
    <div>
      <Section title="Category" activeCount={selectedCategories.length}>
        <ul className="space-y-2.5">
          {withSelected(facets.categories, selectedCategories).map(({ value, count }) => (
            <li key={value}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700 hover:text-stone-900">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(value)}
                  onChange={() => toggleValue("category", value)}
                  className="h-4 w-4 rounded accent-stone-900"
                />
                {titleCase(value)}
                <Count value={count} />
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Gender" activeCount={selectedGenders.length}>
        <div className="flex gap-2">
          {withSelected(facets.genders, selectedGenders).map(({ value, count }) => {
            const active = selectedGenders.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleValue("gender", value)}
                className={cn(
                  "flex-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 text-stone-700 hover:border-stone-400"
                )}
              >
                {GENDER_LABELS[value] ?? value}{" "}
                <span className={active ? "text-white/70" : "text-stone-500"}>{count}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Price" activeCount={params.has("minPrice") || params.has("maxPrice") ? 1 : 0}>
        {facets.price.max > 0 ? (
          <PriceRange bounds={facets.price} params={params} setValues={setValues} />
        ) : (
          <p className="text-sm text-stone-500">No products to price.</p>
        )}
      </Section>

      <Section title="Size" activeCount={selectedSizes.length}>
        {sizeOptions.length === 0 && <p className="text-sm text-stone-500">No sizes available.</p>}
        <div className="space-y-3">
          {SIZE_GROUPS.map((group) => {
            const options = sizeOptions.filter((o) => group.sizes.includes(o.value));
            if (!options.length) return null;
            return (
              <div key={group.label}>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-500">
                  {group.label}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {options.map(({ value, count }) => {
                    const active = selectedSizes.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        aria-label={`Size ${value}, ${count} products`}
                        onClick={() => toggleValue("size", value)}
                        className={cn(
                          "rounded-md border py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-stone-900 bg-stone-900 text-white"
                            : count === 0
                            ? "border-dashed border-stone-300 text-stone-500"
                            : "border-stone-200 text-stone-700 hover:border-stone-900"
                        )}
                      >
                        {value.replace("UK ", "")}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Fit" activeCount={selectedFits.length}>
        <ul className="space-y-2.5">
          {withSelected(facets.fits, selectedFits).map(({ value, count }) => (
            <li key={value}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700 hover:text-stone-900">
                <input
                  type="checkbox"
                  checked={selectedFits.includes(value)}
                  onChange={() => toggleValue("fit", value)}
                  className="h-4 w-4 rounded accent-stone-900"
                />
                {titleCase(value)}
                <Count value={count} />
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Colour" activeCount={selectedColors.length}>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3">
          {withSelected(facets.colors, selectedColors).map(({ value, count }) => {
            const active = selectedColors.includes(value);
            const light = ["white", "beige", "yellow", "pink"].includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                aria-label={`${titleCase(value)}, ${count} products`}
                onClick={() => toggleValue("color", value)}
                className="group/swatch flex flex-col items-center gap-1 text-[11px] text-stone-600"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-shadow",
                    light ? "border-stone-300" : "border-transparent",
                    active
                      ? "ring-2 ring-stone-900 ring-offset-2"
                      : "group-hover/swatch:ring-2 group-hover/swatch:ring-stone-300 group-hover/swatch:ring-offset-2"
                  )}
                  style={{ backgroundColor: COLORS[value] }}
                >
                  {active && (
                    <Check className={cn("h-4 w-4", light ? "text-stone-900" : "text-white")} />
                  )}
                </span>
                {titleCase(value)}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Rating" activeCount={minRating ? 1 : 0}>
        <div className="space-y-1">
          {facets.ratings.map(({ value, count }) => {
            const active = minRating === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setValues({ rating: active ? null : String(value) })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
                )}
              >
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      strokeWidth={1.5}
                      className={cn(
                        "h-3.5 w-3.5",
                        s <= value
                          ? "fill-amber-400 text-amber-400"
                          : active
                          ? "text-white/40"
                          : "text-stone-300"
                      )}
                    />
                  ))}
                </span>
                & up
                <span className={cn("ml-auto text-xs tabular-nums", active ? "text-white/70" : "text-stone-500")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <div className="flex items-center justify-between py-4">
        <span id="in-stock-label" className="text-sm font-semibold text-stone-900">
          In stock only <span className="font-normal text-stone-500">({facets.inStock})</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={inStock}
          aria-labelledby="in-stock-label"
          onClick={() => setValues({ inStock: inStock ? null : "true" })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            inStock ? "bg-stone-900" : "bg-stone-300"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              inStock ? "translate-x-5.5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
