import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { RootState } from "@/redux/store";
import {
  useDeleteReviewMutation,
  useReviewsQuery,
  useSaveReviewMutation,
} from "@/redux/api/productApi";
import { CustomError } from "@/types/api-types";
import { StarInput, StarRating } from "./StarRating";

const ProductReviews = ({ productId, average }: { productId: string; average: number }) => {
  const { user } = useSelector((state: RootState) => state.userReducer);
  // canReview/myReview depend on who is signed in, so cache per viewer
  const { data, isLoading, isError } = useReviewsQuery({
    productId,
    viewer: user?._id ?? "guest",
  });
  const [saveReview, { isLoading: saving }] = useSaveReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const myReview = data?.myReview;
  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
  }, [myReview]);

  // "Rate this item" on an order links here with #reviews; jump to the form once it exists
  const { hash } = useLocation();
  const formBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hash === "#reviews" && !isLoading)
      formBox.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hash, isLoading]);

  const total = data ? Object.values(data.distribution).reduce((a, b) => a + b, 0) : 0;

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rating) return toast.error("Please choose a star rating");
    try {
      const res = await saveReview({ productId, rating, comment }).unwrap();
      toast.success(res.message);
    } catch (error) {
      toast.error((error as CustomError).data?.message || "Could not save your review");
    }
  };

  const deleteHandler = async (reviewId: string, name: string) => {
    if (!window.confirm(`Delete the review by ${name}?`)) return;
    try {
      const res = await deleteReview(reviewId).unwrap();
      toast.success(res.message);
    } catch (error) {
      toast.error((error as CustomError).data?.message || "Could not delete the review");
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-stone-200 pt-14">
      <h2 className="text-2xl font-bold tracking-tight text-stone-900">Customer reviews</h2>

      <div className="mt-8 grid gap-12 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold tracking-tight text-stone-900">
              {total ? average.toFixed(1) : "–"}
            </span>
            <div className="pb-1.5">
              <StarRating value={average} starClassName="h-4 w-4" />
              <p className="mt-1 text-sm text-stone-500">
                {total} review{total === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data?.distribution[star] ?? 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <li key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-3 text-stone-600">{star}</span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100"
                    role="img"
                    aria-label={`${star} stars: ${count} review${count === 1 ? "" : "s"}`}
                  >
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums text-stone-500">{count}</span>
                </li>
              );
            })}
          </ul>

          <div ref={formBox} className="mt-8 rounded-2xl bg-stone-50 p-5">
            {!user ? (
              <p className="text-sm text-stone-600">
                <Link to="/login" className="font-semibold text-stone-900 underline underline-offset-4">
                  Sign in
                </Link>{" "}
                to review a product you've bought.
              </p>
            ) : data?.canReview ? (
              <form onSubmit={submitHandler} className="space-y-4">
                <p className="text-sm font-semibold text-stone-900">
                  {myReview ? "Edit your review" : "Write a review"}
                </p>
                <StarInput value={rating} onChange={setRating} />
                <label className="block">
                  <span className="sr-only">Your review</span>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="How was the fit, fabric and quality?"
                    className="w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-stone-900"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
                >
                  {saving ? "Saving…" : myReview ? "Update review" : "Submit review"}
                </button>
              </form>
            ) : data?.awaitingDelivery ? (
              <p className="text-sm text-stone-600">
                You can review this once your order is delivered.
              </p>
            ) : (
              <p className="text-sm text-stone-600">
                Only customers who have received this item can review it.
              </p>
            )}
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="space-y-6" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-stone-500">Reviews couldn't be loaded right now.</p>
          ) : !data?.reviews.length ? (
            <p className="rounded-2xl border border-dashed border-stone-200 p-10 text-center text-sm text-stone-500">
              No reviews yet. Bought this? Be the first to share your thoughts.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {data.reviews.map((review) => {
                const name = review.user?.name ?? "Former customer";
                const canDelete = user && (review.user?._id === user._id || user.role === "admin");
                return (
                  <li key={review._id} className="py-6 first:pt-0">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-stone-900">{name}</p>
                          <time className="text-xs text-stone-500" dateTime={review.createdAt}>
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                        <StarRating value={review.rating} className="mt-1" />
                        {review.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-stone-700">{review.comment}</p>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteHandler(review._id, name)}
                            aria-label={`Delete review by ${name}`}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
