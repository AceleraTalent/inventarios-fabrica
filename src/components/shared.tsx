import { useState, type ReactNode } from "react"
import { Factory, Minus, Package, Plus, ShoppingBag, Store, Truck, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Product, Stage, StockStatus } from "@/data/types"

export const STAGES: Record<Stage, { label: string; icon: LucideIcon; description: string }> = {
  factory: { label: "Fábrica", icon: Factory, description: "Inventario disponible" },
  transit: { label: "En tránsito", icon: Truck, description: "Camino a tienda" },
  store: { label: "Tienda", icon: Store, description: "Disponible para venta" },
  sold: { label: "Vendido", icon: ShoppingBag, description: "Esta semana" },
}

export function ProductThumb({ product, size = "md", className }: { product: Pick<Product, "name" | "image">; size?: "sm" | "md" | "lg"; className?: string }) {
  const [failed, setFailed] = useState(false)
  const dims = { sm: "h-8 w-8 rounded-lg", md: "h-10 w-10 rounded-xl", lg: "h-16 w-16 rounded-2xl" }[size]
  if (!product.image || failed)
    return (
      <div className={cn("flex shrink-0 items-center justify-center bg-primary-soft text-primary", dims, className)}>
        <Package className={size === "lg" ? "h-7 w-7" : "h-4 w-4"} />
      </div>
    )
  return (
    <img
      src={product.image}
      alt={product.name}
      onError={() => setFailed(true)}
      className={cn("shrink-0 bg-muted object-cover ring-1 ring-black/5", dims, className)}
    />
  )
}

export function ProductCell({ product, onClick }: { product: Product; onClick?: () => void }) {
  return (
    <div className={cn("flex items-center gap-3", onClick && "cursor-pointer")} onClick={onClick}>
      <ProductThumb product={product} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">{product.unit}</p>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "out") return <Badge variant="danger" dot>Out of stock</Badge>
  if (status === "low") return <Badge variant="warning" dot>Low stock</Badge>
  return <Badge variant="success" dot>Normal</Badge>
}

export function SkuTag({ sku }: { sku: string }) {
  return <span className="whitespace-nowrap rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">{sku}</span>
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  )
}

export function MetricCard({ label, value, hint, icon: Icon, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: "default" | "warning" }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone === "warning" ? "bg-amber-50 text-amber-600" : "bg-primary-soft text-primary")}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
      </div>
      <p className="tabular mt-2 text-[28px] font-extrabold leading-none tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

/** Stepper numérico compacto: − [ n ] + */
export function QtyInput({ value, onChange, max, min = 0, className }: { value: number; onChange: (n: number) => void; max?: number; min?: number; className?: string }) {
  const clamp = (n: number) => Math.max(min, max !== undefined ? Math.min(max, n) : n)
  return (
    <div className={cn("inline-flex h-9 items-center rounded-lg border border-input bg-white shadow-soft focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10", className)}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} className="flex h-full w-8 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:opacity-30" disabled={value <= min}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(clamp(Number(e.target.value || 0)))}
        onFocus={(e) => e.target.select()}
        className="tabular h-full w-12 border-x border-input bg-transparent text-center text-sm font-semibold outline-none"
      />
      <button type="button" onClick={() => onChange(clamp(value + 1))} className="flex h-full w-8 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:opacity-30" disabled={max !== undefined && value >= max}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
