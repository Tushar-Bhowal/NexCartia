import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  className?: string;
  starClassName?: string;
};

export const StarRating = ({ value, className, starClassName = "h-3.5 w-3.5" }: StarRatingProps) => (
  <span
    className={cn("inline-flex items-center gap-0.5", className)}
    role="img"
    aria-label={`Rated ${value.toFixed(1)} out of 5`}
  >
    {[1, 2, 3, 4, 5].map((star) => {
      // 0–100% of this star is filled, so 4.5 shows half of the fifth star
      const fill = Math.max(0, Math.min(1, value - star + 1)) * 100;
      return (
        <span key={star} className="relative inline-block">
          <Star className={cn("text-stone-300", starClassName)} strokeWidth={1.5} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
            <Star
              className={cn("fill-amber-400 text-amber-400", starClassName)}
              strokeWidth={1.5}
            />
          </span>
        </span>
      );
    })}
  </span>
);

type StarInputProps = {
  value: number;
  onChange: (value: number) => void;
};

export const StarInput = ({ value, onChange }: StarInputProps) => (
  <div role="group" aria-label="Your rating" className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        aria-pressed={value === star}
        aria-label={`${star} star${star > 1 ? "s" : ""}`}
        onClick={() => onChange(star)}
        className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
      >
        <Star
          className={cn(
            "h-7 w-7",
            star <= value ? "fill-amber-400 text-amber-400" : "text-stone-300"
          )}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
);
