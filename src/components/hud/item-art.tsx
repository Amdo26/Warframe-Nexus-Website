import { useState } from "react";
import { cn } from "@/lib/utils";

export function ItemArt({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const letter = alt.replace(/[^A-Za-z]/g, "").slice(0, 1) || "N";
  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-elevated font-display text-lg text-subtle",
          className,
        )}
        aria-hidden
      >
        {letter}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
