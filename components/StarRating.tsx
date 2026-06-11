"use client";

import { useState } from "react";

export default function StarRating({
  value,
  onChange,
  size = "text-2xl",
}: {
  value?: number | null;
  onChange?: (v: number) => void;
  size?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const readOnly = !onChange;
  return (
    <div className={`inline-flex ${size} leading-none`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(null)}
          onClick={() => onChange?.(n)}
          className={`${readOnly ? "cursor-default" : "cursor-pointer"} px-0.5 ${
            n <= shown ? "text-amber-500" : "text-wine-200"
          }`}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
