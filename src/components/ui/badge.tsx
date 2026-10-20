import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-0.5 font-display text-[0.68rem] font-medium uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        default: "bg-elevated text-muted",
        accent: "bg-accent/15 text-accent",
        live: "bg-live/15 text-live",
        danger: "bg-danger/15 text-danger",
        ok: "bg-ok/15 text-ok",
        outline: "border border-border text-muted",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
