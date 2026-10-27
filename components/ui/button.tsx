import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nebula-violet focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-nebula-violet to-pulsar-indigo text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55)] hover:brightness-110 border border-white/20",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-[0_0_15px_rgba(225,29,72,0.3)]",
        outline:
          "border border-white/15 bg-white/5 text-starlight-white hover:bg-nebula-violet/15 hover:border-nebula-violet/50 hover:text-white backdrop-blur-md",
        secondary:
          "bg-white/10 text-starlight-white hover:bg-white/15 border border-white/10 backdrop-blur-md",
        ghost:
          "hover:bg-nebula-violet/15 hover:text-nebula-lavender text-slate-300",
        link:
          "text-nebula-lavender underline-offset-4 hover:underline",
        stellar:
          "bg-starlight-gold/15 text-starlight-gold border border-starlight-gold/40 hover:bg-starlight-gold/25 shadow-[0_0_15px_rgba(251,191,36,0.25)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]",
        glass:
          "glass-cosmic text-starlight-white hover:border-nebula-violet/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
