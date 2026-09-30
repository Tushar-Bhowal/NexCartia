import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Product } from "@/types/types";
import { COLORS, GENDER_LABELS, formatPrice, titleCase } from "@/lib/catalog";
import { StarRating } from "./StarRating";

type ProductCardProps = {
  product: Product;
  onQuickAdd: (product: Product, size: string) => void;
};

const NEW_FOR_MS = 14 * 24 * 60 * 60 * 1000;

const ProductCard = ({ product, onQuickAdd }: ProductCardProps) => {
  const { _id, name, price, photos, stock, sizes = [], color, category, gender } = product;
  const ratings = product.ratings ?? 0;
  const numOfReviews = product.numOfReviews ?? 0;
  const soldOut = stock < 1;
  const isNew =
    !!product.createdAt && Date.now() - new Date(product.createdAt).getTime() < NEW_FOR_MS;

  const badge = soldOut
    ? { text: "Sold out", className: "bg-stone-900/85 text-white" }
    : stock <= 3
    ? { text: `Only ${stock} left`, className: "bg-white/90 text-red-700" }
    : isNew
    ? { text: "New", className: "bg-white/90 text-stone-900" }
    : null;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-stone-100">
        <Link to={`/product/${_id}`} className="absolute inset-0" aria-label={name}>
          {photos[0] && (
            <img
              src={photos[0].url}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            />
          )}
          {photos[1] && (
            <img
              src={photos[1].url}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {badge && (
          <span
            className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur ${badge.className}`}
          >
            {badge.text}
          </span>
        )}

        {!soldOut && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-2 rounded-xl bg-white/95 p-2.5 opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 md:pointer-fine:block">
            {sizes.length ? (
              <>
                <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-stone-500">
                  Quick add
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onQuickAdd(product, size)}
                      aria-label={`Add ${name} in size ${size} to bag`}
                      className="min-w-9 rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-800 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
                    >
                      {size.replace("UK ", "")}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onQuickAdd(product, "")}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-stone-900 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Add to bag
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1 px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
          {titleCase(category)} · {GENDER_LABELS[gender] ?? gender}
        </p>
        <h3 className="line-clamp-1 text-sm font-semibold text-stone-900">
          <Link to={`/product/${_id}`} className="hover:underline">
            {name}
          </Link>
        </h3>
        {numOfReviews > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <StarRating value={ratings} />
            <span>
              {ratings.toFixed(1)} ({numOfReviews})
            </span>
          </div>
        ) : (
          <p className="text-xs text-stone-500">No reviews yet</p>
        )}
        <div className="mt-0.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-900">{formatPrice(price)}</p>
          {color && (
            <span
              title={titleCase(color)}
              aria-label={`Colour: ${color}`}
              className="h-3.5 w-3.5 rounded-full border border-stone-300"
              style={{ backgroundColor: COLORS[color] }}
            />
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
