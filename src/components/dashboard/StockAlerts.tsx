import { CheckCircle2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, ProductThumb, StatusBadge } from "@/components/shared"
import { useInventory } from "@/store/inventory"
import type { Product } from "@/data/types"

export function StockAlerts({ list }: { list: Product[] }) {
  const { stockStatus, openModal, openProduct } = useInventory()
  const alerts = list.filter((p) => stockStatus(p) !== "normal").sort((a, b) => a.store - b.store)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Alertas de tienda</CardTitle>
          <CardDescription className="mt-0.5">Productos que necesitan reposición</CardDescription>
        </div>
      </CardHeader>
      {alerts.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Todo en orden" description="Ningún producto tiene stock bajo en tienda." />
      ) : (
        <div className="flex-1 space-y-1 px-3 pb-3">
          {alerts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-muted/60">
              <button onClick={() => openProduct(p.id)} className="flex flex-1 items-center gap-3 text-left">
                <ProductThumb product={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="tabular font-semibold text-foreground">{p.store}</span> en tienda · {p.factory} en fábrica
                  </p>
                </div>
              </button>
              <StatusBadge status={stockStatus(p)} />
            </div>
          ))}
        </div>
      )}
      {alerts.length > 0 && (
        <div className="border-t p-4">
          <Button variant="soft" className="w-full" onClick={() => openModal({ type: "ship" })}>
            <Truck /> Reponer desde fábrica
          </Button>
        </div>
      )}
    </Card>
  )
}
