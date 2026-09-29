import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary-soft text-primary",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15",
        danger: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/10",
        info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/10",
        neutral: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
