import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  kicker,
  action,
  className,
  children,
  padded = true,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  kicker?: string;
  action?: ReactNode;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-surface hairline",
        padded ? "p-4" : "p-0",
        className,
      )}
      {...props}
    >
      {(title || action || kicker) && (
        <header className={cn("flex items-end justify-between gap-3", padded ? "mb-4" : "px-4 pt-4")}>
          <div>
            {kicker ? (
              <p className="mb-1 font-display text-[0.65rem] uppercase tracking-[0.22em] text-accent">
                {kicker}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-display text-sm uppercase tracking-[0.18em] text-muted">{title}</h2>
            ) : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
