import { Check } from "lucide-react";
import { COLORS, CatalogValues, FITS, SIZE_GROUPS, titleCase } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const labelClass = "block mb-2 text-sm font-medium text-gray-900";
const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

const CatalogFields = ({
  values,
  onChange,
}: {
  values: CatalogValues;
  onChange: (values: CatalogValues) => void;
}) => {
  const set = (patch: Partial<CatalogValues>) => onChange({ ...values, ...patch });
  const toggleSize = (size: string) =>
    set({
      sizes: values.sizes.includes(size)
        ? values.sizes.filter((s) => s !== size)
        : [...values.sizes, size],
    });

  return (
    <>
      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="What makes this piece special: cut, feel, how to wear it"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="material" className={labelClass}>
          Material
        </label>
        <input
          id="material"
          type="text"
          maxLength={200}
          value={values.material}
          onChange={(e) => set({ material: e.target.value })}
          placeholder="eg. 100% cotton"
          className={inputClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>Sizes available</legend>
        <div className="space-y-2">
          {SIZE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-xs text-gray-500">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.sizes.map((size) => {
                  const active = values.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSize(size)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium",
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 text-gray-700 hover:border-gray-900"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Leave empty for items that don't come in sizes.</p>
      </fieldset>

      <div>
        <label htmlFor="fit" className={labelClass}>
          Fit
        </label>
        <select
          id="fit"
          value={values.fit}
          onChange={(e) => set({ fit: e.target.value })}
          className={inputClass}
        >
          <option value="">Not applicable</option>
          {FITS.map((fit) => (
            <option key={fit} value={fit}>
              {titleCase(fit)}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={labelClass}>Colour</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COLORS).map(([name, hex]) => {
            const active = values.color === name;
            const light = ["white", "beige", "yellow", "pink"].includes(name);
            return (
              <button
                key={name}
                type="button"
                title={titleCase(name)}
                aria-label={titleCase(name)}
                aria-pressed={active}
                onClick={() => set({ color: active ? "" : name })}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  light ? "border-gray-300" : "border-transparent",
                  active && "ring-2 ring-gray-900 ring-offset-2"
                )}
                style={{ backgroundColor: hex }}
              >
                {active && <Check className={cn("h-4 w-4", light ? "text-gray-900" : "text-white")} />}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {values.color ? `Selected: ${titleCase(values.color)}` : "No colour selected"}
        </p>
      </fieldset>
    </>
  );
};

export default CatalogFields;
