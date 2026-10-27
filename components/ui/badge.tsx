import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-nebula-violet text-white hover:bg-nebula-violet/80 shadow-[0_0_12px_rgba(139,92,246,0.3)]",
        secondary:
          "border-white/10 bg-white/5 text-starlight-white hover:bg-white/10 hover:border-nebula-violet/30",
        destructive:
          "border-transparent bg-rose-600 text-white hover:bg-rose-700",
        outline:
          "text-starlight-white border-white/15 hover:border-nebula-violet/50 hover:bg-nebula-violet/10",
        stellar:
          "border-starlight-gold/40 bg-starlight-gold/10 text-starlight-gold hover:bg-starlight-gold/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]",
        nebula:
          "border-nebula-violet/40 bg-nebula-violet/15 text-nebula-lavender hover:bg-nebula-violet/25 shadow-[0_0_12px_rgba(139,92,246,0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
