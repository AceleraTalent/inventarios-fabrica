import { useMemo, useState } from "react"
import { CalendarDays, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader, ProductThumb } from "@/components/shared"
import { ProductSelect } from "@/components/ProductSelect"
import { StageFlow } from "@/components/dashboard/StageFlow"
import { InventoryTable } from "@/components/dashboard/InventoryTable"
import { WeeklyChart } from "@/components/dashboard/WeeklyChart"
import { StockAlerts } from "@/components/dashboard/StockAlerts"
import { CURRENT_WEEK, PREVIOUS_WEEK, weeklySeries } from "@/data/mock"
import { useInventory } from "@/store/inventory"

export function Dashboard() {
  const { products, filter, setFilter, getProduct } = useInventory()
  const [week, setWeek] = useState<"current" | "previous">("current")

  const list = useMemo(() => (filter === "all" ? products : products.filter((p) => p.id === filter)), [products, filter])
  const selected = filter !== "all" ? getProduct(filter) : undefined
  const chart = useMemo(() => weeklySeries(list, week), [list, week])

  return (
    <>
      <PageHeader title="Inventory Overview" subtitle="Vista general del flujo de inventario">
        <Select value={week} onValueChange={(v) => setWeek(v as typeof week)}>
          <SelectTrigger className="w-[190px]">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Semana actual</SelectItem>
            <SelectItem value="previous">Semana anterior</SelectItem>
          </SelectContent>
        </Select>
        <ProductSelect value={filter} onChange={setFilter} includeAll className="w-[230px]" />
      </PageHeader>

      {selected && (
        <div className="-mt-3 mb-5 flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-1">
          Mostrando únicamente
          <span className="inline-flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-2 font-semibold text-foreground shadow-soft">
            <ProductThumb product={selected} size="sm" className="!h-6 !w-6 !rounded-full" />
            {selected.name} · {selected.sku}
            <button onClick={() => setFilter("all")} className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      )}

      <section className="mb-8">
        <StageFlow list={list} />
      </section>

      <section className="mb-8">
        <InventoryTable list={list} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WeeklyChart data={chart} subtitle={week === "current" ? `Semana actual · ${CURRENT_WEEK}` : `Semana anterior · ${PREVIOUS_WEEK}`} />
        </div>
        <StockAlerts list={list} />
      </section>
    </>
  )
}
