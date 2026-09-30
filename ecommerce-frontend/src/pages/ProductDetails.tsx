import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import ProductCard from "@/components/Shared/ProductCard";
import ProductReviews from "@/components/Shared/ProductReviews";
import { StarRating } from "@/components/Shared/StarRating";
import { ProductCardSkeleton } from "@/components/Shared/Loader";
import { useProductDetailsQuery, useSearchProductsQuery } from "@/redux/api/productApi";
import { useAddToCart } from "@/hooks/useAddToCart";
import { RootState } from "@/redux/store";
import { Product } from "@/types/types";
import { COLORS, GENDER_LABELS, formatPrice, titleCase } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const FIT_NOTES: Record<string, string> = {
  slim: "Cut close to the body for a sharp, tailored look.",
  regular: "A classic, true-to-size fit with a little room to move.",
  relaxed: "Roomier through the body for easy, all-day comfort.",
  oversized: "Deliberately loose and boxy. Size down for a closer fit.",
};

const Gallery = ({ photos, name }: { photos: Product["photos"]; name: string }) => {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const show = (next: number) => {
    const i = (next + photos.length) % photos.length;
    setIndex(i);
    scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: "smooth" });
  };

  if (!photos.length) return <div className="aspect-3/4 rounded-3xl bg-stone-100" />;

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {photos.length > 1 && (
        <div className="hidden gap-3 md:flex md:flex-col" role="group" aria-label="Product photos">
          {photos.map((photo, i) => (
            <button
              key={photo.public_id}
              type="button"
              aria-pressed={i === index}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => show(i)}
              className={cn(
                "h-24 w-18 overflow-hidden rounded-xl border-2 transition",
                i === index ? "border-stone-900" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1">
        {/* Mobile: swipeable strip; desktop: one image with hover zoom */}
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl [scrollbar-width:none] md:hidden"
        >
          {photos.map((photo, i) => (
            <img
              key={photo.public_id}
              src={photo.url}
              alt={i === 0 ? name : `${name}, photo ${i + 1}`}
              className="aspect-3/4 w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>

        <div
          className="relative hidden aspect-3/4 cursor-zoom-in overflow-hidden rounded-3xl bg-stone-100 md:block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <img
            src={photos[index].url}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-200"
            style={
              zoom
                ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          />
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => show(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md backdrop-blur transition hover:bg-white md:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => show(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md backdrop-blur transition hover:bg-white md:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
              {photos.map((photo, i) => (
                <span
                  key={photo.public_id}
                  className={cn(
                    "h-1.5 rounded-full bg-white transition-all",
                    i === index ? "w-5" : "w-1.5 opacity-60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Detail = ({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) => (
  <details open={open} className="group border-b border-stone-200 py-4">
    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
      {title}
      <ChevronDown className="h-4 w-4 text-stone-500 transition-transform group-open:rotate-180" />
    </summary>
    <div className="mt-3 text-sm leading-relaxed text-stone-600">{children}</div>
  </details>
);

const ProductDetailsView = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const { user } = useSelector((state: RootState) => state.userReducer);
  const cartItems = useSelector((state: RootState) => state.cartReducer.cartItems);
  const { data, isLoading, isError, error, refetch } = useProductDetailsQuery(id);
  const product = data?.product;

  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const sizeRef = useRef<HTMLDivElement>(null);

  // A #reviews link scrolls to the review form itself (ProductReviews), so don't undo it
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== "#reviews") window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: related, isLoading: relatedLoading } = useSearchProductsQuery(
    product ? `category=${encodeURIComponent(product.category)}&sort=rating` : "",
    { skip: !product }
  );
  const relatedProducts = related?.products.filter((p) => p._id !== product?._id).slice(0, 4) ?? [];

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-28 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="aspect-3/4 animate-pulse rounded-3xl bg-stone-100" />
        <div className="space-y-4">
          {[40, 75, 30, 90, 60].map((w) => (
            <div key={w} className="h-6 animate-pulse rounded bg-stone-100" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );

  const notFound = !isError || (error && "status" in error && (error.status === 404 || error.status === 400));

  if (isError || !product)
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 pt-16 text-center">
        <p className="text-xl font-semibold text-stone-900">
          {notFound ? "This product could not be found" : "We couldn't load this product"}
        </p>
        <p className="text-sm text-stone-500">
          {notFound
            ? "It may have been removed or the link is incorrect."
            : "Check your connection and try again."}
        </p>
        {!notFound && (
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-stone-900 px-6 py-2.5 text-sm font-semibold text-stone-900"
          >
            Retry
          </button>
        )}
        <Link to="/search" className="mt-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white">
          Continue shopping
        </Link>
      </div>
    );

  const sizes = product.sizes ?? [];
  const soldOut = product.stock < 1;
  const inCart = cartItems
    .filter((i) => i.productId === product._id)
    .reduce((sum, i) => sum + i.quantity, 0);
  const remaining = product.stock - inCart;
  const allInBag = !soldOut && remaining < 1;
  const maxQuantity = Math.max(1, remaining);
  const ratings = product.ratings ?? 0;
  const numOfReviews = product.numOfReviews ?? 0;

  const add = () => {
    if (sizes.length && !size) {
      setSizeError(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    const added = addToCart(product, size, quantity);
    if (added) setQuantity(1);
    return added;
  };

  const buyNow = () => {
    // everything available is already in the bag: just go to checkout
    if (!allInBag && !add()) return;
    if (user) navigate("/shipping");
    else {
      toast("Sign in to check out — your bag is saved.");
      navigate("/login");
    }
  };

  return (
    <div className="bg-white pb-28 pt-16 md:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="py-5 text-xs text-stone-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-stone-900">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/search" className="hover:text-stone-900">Shop</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                to={`/search?category=${encodeURIComponent(product.category)}`}
                className="hover:text-stone-900"
              >
                {titleCase(product.category)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-stone-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
          <Gallery photos={product.photos} name={product.name} />

          <div className="md:sticky md:top-24 md:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-150">
              {titleCase(product.category)} · {GENDER_LABELS[product.gender] ?? product.gender}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 lg:text-4xl">
              {product.name}
            </h1>

            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900">
              <StarRating value={ratings} starClassName="h-4 w-4" />
              {numOfReviews > 0 ? (
                <span>
                  {ratings.toFixed(1)} · {numOfReviews} review{numOfReviews === 1 ? "" : "s"}
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
            </a>

            <p className="mt-6 text-2xl font-semibold text-stone-900">{formatPrice(product.price)}</p>
            <p className="mt-1 text-xs text-stone-500">Taxes and shipping calculated at checkout</p>

            {product.color && (
              <div className="mt-8 flex items-center gap-3 text-sm">
                <span className="font-semibold text-stone-900">Colour</span>
                <span
                  className="h-5 w-5 rounded-full border border-stone-300"
                  style={{ backgroundColor: COLORS[product.color] }}
                  aria-hidden="true"
                />
                <span className="text-stone-600">{titleCase(product.color)}</span>
              </div>
            )}

            {sizes.length > 0 && (
              <div ref={sizeRef} className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-stone-900">
                    Size{size && <span className="font-normal text-stone-600"> · {size}</span>}
                  </span>
                  {product.fit && (
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">
                      {titleCase(product.fit)} fit
                    </span>
                  )}
                </div>
                <div role="group" aria-label="Choose a size" className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      disabled={soldOut}
                      onClick={() => {
                        setSize(s);
                        setSizeError(false);
                      }}
                      className={cn(
                        "h-11 min-w-14 rounded-xl border px-3 text-sm font-medium transition",
                        size === s
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 text-stone-800 hover:border-stone-900",
                        soldOut && "cursor-not-allowed opacity-40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p role="alert" className="mt-2 min-h-5 text-sm text-red-600">
                  {sizeError ? "Please select a size" : ""}
                </p>
              </div>
            )}

            <p
              className={cn(
                "mt-4 flex items-center gap-2 text-sm font-medium",
                soldOut ? "text-stone-500" : product.stock <= 3 ? "text-red-700" : "text-green-700"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  soldOut ? "bg-stone-400" : product.stock <= 3 ? "bg-red-600" : "bg-green-600"
                )}
              />
              {soldOut
                ? "Sold out"
                : product.stock <= 3
                ? `Only ${product.stock} left — order soon`
                : "In stock, ready to ship"}
            </p>

            {!soldOut && (
              <div className="mt-6 flex gap-3">
                <div className="flex items-center rounded-full border border-stone-200">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || allInBag}
                    onClick={() => setQuantity((q) => q - 1)}
                    className="flex h-12 w-11 items-center justify-center disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= maxQuantity || allInBag}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-12 w-11 items-center justify-center disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={add}
                  disabled={allInBag}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-stone-900 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4" /> {allInBag ? "All in your bag" : "Add to bag"}
                </button>
              </div>
            )}
            {!soldOut && (
              <button
                type="button"
                onClick={buyNow}
                className="mt-3 h-12 w-full rounded-full border border-stone-900 text-sm font-semibold text-stone-900 transition hover:bg-stone-900 hover:text-white"
              >
                Buy now
              </button>
            )}

            <ul className="mt-8 space-y-3 rounded-2xl bg-stone-50 p-5 text-sm text-stone-700">
              <li className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-stone-900" /> Free shipping on orders over ₹1,000
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-stone-900" /> Secure checkout with Stripe
              </li>
            </ul>

            <div className="mt-6">
              {product.description && (
                <Detail title="Description" open>
                  {product.description}
                </Detail>
              )}
              {product.material && <Detail title="Material">{product.material}</Detail>}
              {product.fit && (
                <Detail title="Fit">
                  <span className="font-medium text-stone-900">{titleCase(product.fit)} fit.</span>{" "}
                  {FIT_NOTES[product.fit]}
                </Detail>
              )}
            </div>
          </div>
        </div>

        <div className="mt-20">
          <ProductReviews productId={product._id} average={ratings} />
        </div>

        {(relatedProducts.length > 0 || relatedLoading) && (
          <section className="mt-20 border-t border-stone-200 pt-14">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">You may also like</h2>
              <Link
                to={`/search?category=${encodeURIComponent(product.category)}`}
                className="text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {relatedLoading
                ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
                : relatedProducts.map((p) => (
                    <ProductCard key={p._id} product={p} onQuickAdd={(item, s) => addToCart(item, s)} />
                  ))}
            </div>
          </section>
        )}
      </div>

      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900">{product.name}</p>
            <p className="text-sm text-stone-600">
              {formatPrice(product.price)}
              {size && ` · ${size}`}
            </p>
          </div>
          <button
            type="button"
            onClick={allInBag ? buyNow : add}
            className="flex h-11 items-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-semibold text-white"
          >
            <ShoppingBag className="h-4 w-4" /> {allInBag ? "Checkout" : "Add to bag"}
          </button>
        </div>
      )}
    </div>
  );
};

// Keyed by id so size, quantity and gallery state reset when opening another product
const ProductDetails = () => {
  const { id } = useParams();
  return <ProductDetailsView key={id} id={id!} />;
};

export default ProductDetails;
