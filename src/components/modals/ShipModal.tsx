import { useEffect, useMemo, useState } from "react"
import { Truck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ProductThumb, QtyInput } from "@/components/shared"
import { ModalShell } from "./ModalShell"
import { cn } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

export function ShipModal() {
  const { modal, closeModal, products, createShipment, stockStatus } = useInventory()
  const open = modal?.type === "ship"
  const [qty, setQty] = useState<Record<string, number>>({})

  useEffect(() => { if (open) setQty({}) }, [open])

  const items = useMemo(() => Object.entries(qty).filter(([, q]) => q > 0).map(([productId, q]) => ({ productId, qty: q })), [qty])
  const totalUnits = items.reduce((a, i) => a + i.qty, 0)

  // sugerencia: reponer productos con stock bajo en tienda
  const suggest = () => {
    const next: Record<string, number> = {}
    products.forEach((p) => {
      if (stockStatus(p) !== "normal" && p.factory > 0) next[p.id] = Math.min(p.factory, 20)
    })
    setQty(next)
  }

  const submit = () => {
    if (!items.length) return
    const id = createShipment(items)
    toast.success("Envío creado", { description: `${id} · ${totalUnits} unidades en camino a tienda` })
    closeModal()
  }

  return (
    <ModalShell
      open={open} onClose={closeModal} icon={Truck} className="max-w-xl"
      title="Enviar a tienda" description="Selecciona productos y cantidades a despachar"
      footer={<>
        <div className="mr-auto hidden items-center text-sm text-muted-foreground sm:flex">
          <b className="tabular mr-1 text-foreground">{totalUnits}</b> unidades · {items.length} productos
        </div>
        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
        <Button onClick={submit} disabled={!items.length}>Crear envío</Button>
      </>}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Fábrica → Tienda</p>
        <button onClick={suggest} className="text-xs font-semibold text-primary hover:underline">Sugerir reposición</button>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-[1fr_90px_128px] gap-2 border-b bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Producto</span><span className="text-right">Disponible</span><span className="text-right">A enviar</span>
        </div>
        <div className="max-h-[340px] divide-y overflow-y-auto">
          {products.map((p) => {
            const v = qty[p.id] ?? 0
            return (
              <div key={p.id} className={cn("grid grid-cols-[1fr_90px_128px] items-center gap-2 px-4 py-2 transition-colors", v > 0 && "bg-primary-soft/50")}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProductThumb product={p} size="sm" />
                  <span className="truncate text-sm font-semibold">{p.name}</span>
                </div>
                <span className="tabular text-right text-sm text-muted-foreground">{p.factory}</span>
                <div className="flex justify-end">
                  <QtyInput value={v} max={p.factory} onChange={(n) => setQty((s) => ({ ...s, [p.id]: n }))} className={p.factory === 0 ? "pointer-events-none opacity-40" : ""} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ModalShell>
  )
}
