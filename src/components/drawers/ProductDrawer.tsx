import type { ReactNode } from "react"
import { ArrowRight, Factory, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { ProductThumb, SkuTag, STAGES, StatusBadge } from "@/components/shared"
import { productHistory } from "@/data/mock"
import { cn, formatMoney, formatNumber, marginPct } from "@/lib/utils"
import { useInventory } from "@/store/inventory"
import type { Stage } from "@/data/types"

const TONE: Record<Stage, string> = {
  factory: "bg-primary-soft text-primary",
  transit: "bg-sky-50 text-sky-600",
  store: "bg-violet-50 text-violet-600",
  sold: "bg-amber-50 text-amber-600",
}

export function ProductDrawer() {
  const { drawer, closeDrawer, getProduct, stockStatus, openModal, history } = useInventory()
  const product = drawer?.kind === "product" ? getProduct(drawer.id) : undefined

  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent>
        {product && (
          <>
            <div className="flex items-center gap-4 border-b px-7 pb-6 pt-7">
              <ProductThumb product={product} size="lg" />
              <div className="min-w-0">
                <SheetTitle className="text-xl">{product.name}</SheetTitle>
                <SheetDescription asChild>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <SkuTag sku={product.sku} />
                    <span className="text-xs">{product.unit}</span>
                    <StatusBadge status={stockStatus(product)} />
                  </div>
                </SheetDescription>
              </div>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-7 py-6">
              {/* Flujo de unidades */}
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidades por etapa</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(STAGES) as Stage[]).map((s, i) => {
                    const Icon = STAGES[s].icon
                    return (
                      <div key={s} className="relative rounded-xl border bg-white p-3">
                        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                        <p className="tabular mt-2 text-2xl font-extrabold leading-none">{formatNumber(product[s])}</p>
                        <p className="mt-1 text-[11px] font-medium text-muted-foreground">{STAGES[s].label}</p>
                        {i < 3 && (
                          <ArrowRight className="absolute -right-[11px] top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white text-primary" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Precios */}
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Precio y margen</p>
                <div className="divide-y rounded-xl border">
                  <Row label="Costo unitario" value={formatMoney(product.cost)} />
                  <Row label="Precio de venta" value={formatMoney(product.price)} />
                  <Row
                    label="Margen estimado"
                    value={
                      <span className="flex items-center gap-2">
                        {formatMoney(product.price - product.cost)}
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{marginPct(product.cost, product.price).toFixed(0)}%</span>
                      </span>
                    }
                  />
                </div>
              </section>

              {/* Historial */}
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Historial reciente</p>
                <ol className="relative ml-1.5 space-y-5 border-l border-dashed border-border pl-6">
                  {[...history.filter((h) => h.productId === product.id), ...productHistory(product)].map((h, i) => (
                    <li key={i} className="relative">
                      <span className={cn("absolute -left-[31px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white", TONE[h.tone])}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{h.type}</p>
                          <p className="text-xs text-muted-foreground">{h.date}</p>
                        </div>
                        <span className={cn("tabular rounded-md px-2 py-0.5 text-xs font-bold", h.detail.startsWith("-") ? "bg-muted text-slate-600" : "bg-emerald-50 text-emerald-700")}>
                          {h.detail}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t p-5">
              <Button variant="outline" onClick={() => openModal({ type: "production", productId: product.id })}>
                <Factory /> Producción
              </Button>
              <Button onClick={() => openModal({ type: "sale", productId: product.id })} disabled={product.store <= 0}>
                <ShoppingBag /> Registrar venta
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-semibold">{value}</span>
    </div>
  )
}
