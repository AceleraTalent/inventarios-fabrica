import { useState } from "react"
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Factory, PackageCheck, Store, Truck } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState, MetricCard, PageHeader, ProductThumb } from "@/components/shared"
import { cn, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"
import type { Shipment } from "@/data/types"

type Tab = "all" | "in_transit" | "received"

export function TransitPage() {
  const { shipments, openModal } = useInventory()
  const [tab, setTab] = useState<Tab>("all")
  const [detailId, setDetailId] = useState<string | null>(null)

  const active = shipments.filter((s) => s.status === "in_transit")
  const units = (s: Shipment) => s.items.reduce((a, i) => a + i.qty, 0)
  const list = tab === "all" ? shipments : shipments.filter((s) => s.status === tab)

  return (
    <>
      <PageHeader title="En tránsito" subtitle="Envíos de fábrica hacia la tienda">
        <Button onClick={() => openModal({ type: "ship" })}><Truck /> Nuevo envío</Button>
      </PageHeader>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Envíos activos" value={active.length} hint="Pendientes por recibir" icon={Truck} />
        <MetricCard label="Unidades en camino" value={formatNumber(active.reduce((a, s) => a + units(s), 0))} hint="Fábrica → Tienda" icon={Clock} />
        <MetricCard label="Recibidos" value={shipments.length - active.length} hint="Últimos 7 días" icon={PackageCheck} />
      </div>

      <div className="mb-5 inline-flex rounded-xl border bg-white p-1 shadow-soft">
        {([["all", "Todos"], ["in_transit", "En tránsito"], ["received", "Recibidos"]] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition", tab === k ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")}>
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card><EmptyState icon={Truck} title="No hay envíos aquí" description="Crea un envío desde el botón “Enviar a tienda”." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((s) => (
            <Card key={s.id} className="group p-6 transition hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-bold">{s.id}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {s.date}</p>
                </div>
                {s.status === "in_transit" ? <Badge variant="info" dot>En tránsito</Badge> : <Badge variant="success" dot>Recibido</Badge>}
              </div>

              <div className="my-6 flex items-center gap-3">
                <Place icon={Factory} label="Fábrica" />
                <div className="relative flex flex-1 items-center">
                  <div className={cn("h-px flex-1 border-t-2 border-dashed", s.status === "received" ? "border-primary/50" : "border-border")} />
                  <div className={cn("absolute left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border bg-white", s.status === "received" ? "text-primary" : "text-sky-600")}>
                    {s.status === "received" ? <CheckCircle2 className="h-4 w-4" /> : <Truck className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <Place icon={Store} label="Tienda" />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="tabular text-3xl font-extrabold leading-none">{units(s)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">unidades · {s.items.length} productos</p>
                </div>
                <div className="flex -space-x-2">
                  {s.items.slice(0, 4).map((i) => <ItemAvatar key={i.productId} id={i.productId} />)}
                  {s.items.length > 4 && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-bold ring-2 ring-white">+{s.items.length - 4}</span>}
                </div>
              </div>

              <Button variant="outline" className="mt-6 w-full" onClick={() => setDetailId(s.id)}>
                Ver detalle <ArrowRight />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <ShipmentDetail id={detailId} onClose={() => setDetailId(null)} />
    </>
  )
}

function Place({ icon: Icon, label }: { icon: typeof Factory; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-slate-600"><Icon className="h-4 w-4" strokeWidth={1.8} /></div>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}

function ItemAvatar({ id }: { id: string }) {
  const { getProduct } = useInventory()
  const p = getProduct(id)
  return p ? <ProductThumb product={p} size="sm" className="!rounded-full ring-2 ring-white" /> : null
}

function ShipmentDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { shipments, getProduct, receiveShipment } = useInventory()
  const s = shipments.find((x) => x.id === id)
  const total = s?.items.reduce((a, i) => a + i.qty, 0) ?? 0

  const receive = () => {
    if (!s) return
    receiveShipment(s.id)
    toast.success("Inventario recibido", { description: `${s.id} · ${total} unidades sumadas a tienda` })
    onClose()
  }

  return (
    <Dialog open={!!s} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {s && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-mono">{s.id}</DialogTitle>
                {s.status === "in_transit" ? <Badge variant="info" dot>En tránsito</Badge> : <Badge variant="success" dot>Recibido</Badge>}
              </div>
              <DialogDescription>Fábrica → Tienda · despachado el {s.date}</DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-xl border">
              <div className="flex justify-between border-b bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Producto</span><span>Cantidad</span>
              </div>
              <div className="max-h-[300px] divide-y overflow-y-auto">
                {s.items.map((i) => {
                  const p = getProduct(i.productId)
                  if (!p) return null
                  return (
                    <div key={i.productId} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2.5"><ProductThumb product={p} size="sm" /><span className="text-sm font-semibold">{p.name}</span></div>
                      <span className="tabular text-sm font-bold">{i.qty}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between border-t bg-muted/30 px-4 py-3 text-sm font-bold">
                <span>Total</span><span className="tabular">{total} unidades</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
              {s.status === "in_transit" ? (
                <Button onClick={receive}><PackageCheck /> Marcar como recibido</Button>
              ) : (
                <Button disabled><CheckCircle2 /> Recibido</Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
