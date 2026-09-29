import { Factory, ShoppingBag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ProductThumb, STAGES } from "@/components/shared"
import { formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"
import type { Stage } from "@/data/types"

export function StageDrawer() {
  const { drawer, closeDrawer, products, filter, shipments, openProduct, openModal, setPage } = useInventory()
  const stage: Stage | null = drawer?.kind === "stage" ? drawer.stage : null
  const open = stage !== null

  const list = filter === "all" ? products : products.filter((p) => p.id === filter)
  const rows = stage ? [...list].sort((a, b) => b[stage] - a[stage]) : []
  const total = stage ? list.reduce((a, p) => a + p[stage], 0) : 0
  const max = Math.max(1, ...rows.map((p) => (stage ? p[stage] : 0)))
  const meta = stage ? STAGES[stage] : null
  const Icon = meta?.icon
  const ids = new Set(list.map((p) => p.id))
  const active = shipments.filter((s) => s.status === "in_transit" && s.items.some((i) => ids.has(i.productId)))

  const cta =
    stage === "factory" ? { label: "Registrar producción", icon: Factory, run: () => openModal({ type: "production" }) }
    : stage === "transit" ? { label: "Crear nuevo envío", icon: Truck, run: () => openModal({ type: "ship" }) }
    : stage === "store" ? { label: "Registrar venta", icon: ShoppingBag, run: () => openModal({ type: "sale" }) }
    : null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent>
        {meta && Icon && stage && (
          <>
            <div className="border-b px-7 pb-6 pt-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <SheetTitle className="uppercase tracking-wide">{meta.label}</SheetTitle>
                  <SheetDescription>{meta.description}</SheetDescription>
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="tabular text-5xl font-extrabold tracking-tight">{formatNumber(total)}</span>
                <span className="font-medium text-muted-foreground">unidades</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {stage === "transit" && active.length > 0 && (
                <div className="mb-4 px-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Envíos activos</p>
                  <div className="flex flex-wrap gap-2">
                    {active.map((s) => (
                      <button key={s.id} onClick={() => { closeDrawer(); setPage("transit") }} className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:bg-primary-soft">
                        {s.id} · {s.items.reduce((a, i) => a + i.qty, 0)} u.
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Por producto</p>
              {rows.map((p) => (
                <button key={p.id} onClick={() => openProduct(p.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted/70">
                  <ProductThumb product={p} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold">{p.name}</span>
                      <span className="tabular text-sm font-bold">{formatNumber(p[stage])}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/80 transition-all" style={{ width: `${(p[stage] / max) * 100}%` }} />
                    </div>
                  </div>
                </button>
              ))}
              {rows.every((p) => p[stage] === 0) && (
                <div className="mt-4 px-3"><Badge variant="neutral">Sin unidades en esta etapa</Badge></div>
              )}
            </div>

            {cta && (
              <div className="border-t p-5">
                <Button className="w-full" size="lg" onClick={cta.run}>
                  <cta.icon /> {cta.label}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
