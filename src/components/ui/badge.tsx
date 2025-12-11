import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30",
        secondary:
          "bg-slate-700/50 text-slate-300 border border-slate-600/30",
        destructive:
          "bg-red-600/20 text-red-300 border border-red-500/30",
        success:
          "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30",
        warning:
          "bg-amber-600/20 text-amber-300 border border-amber-500/30",
        outline: "border border-slate-600 text-slate-300",
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

