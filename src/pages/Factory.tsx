import { useEffect, useState } from "react"
import { ArrowDownRight, ArrowUpRight, Boxes, CalendarDays, Factory as FactoryIcon, History, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MetricCard, PageHeader, ProductCell, SkuTag } from "@/components/shared"
import { CURRENT_WEEK } from "@/data/mock"
import { cn, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

export function FactoryPage() {
  const { products, saveWeeklyProduction } = useInventory()
  const [values, setValues] = useState<Record<string, number>>({})

  const reset = () => setValues(Object.fromEntries(products.map((p) => [p.id, p.weekProduction])))
  useEffect(reset, [products]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = products.reduce((a, p) => a + (values[p.id] ?? 0), 0)
  const prevTotal = products.reduce((a, p) => a + p.prevWeek, 0)
  const dirty = products.some((p) => (values[p.id] ?? 0) !== p.weekProduction)

  const usePrevious = () => {
    setValues(Object.fromEntries(products.map((p) => [p.id, p.prevWeek])))
    toast("Cantidades copiadas", { description: "Se usaron los valores de la semana pasada" })
  }
  const save = () => {
    saveWeeklyProduction(values)
    toast.success("Producción semanal actualizada", { description: `${formatNumber(total)} unidades cargadas` })
  }

  return (
    <>
      <PageHeader title="Fábrica" subtitle="Carga semanal de producción" />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Semana actual" value={<span className="text-2xl">{CURRENT_WEEK}</span>} hint="Semana 40 · 2026" icon={CalendarDays} />
        <MetricCard label="Total producido" value={formatNumber(total)} hint={`${formatNumber(prevTotal)} la semana pasada`} icon={FactoryIcon} />
        <MetricCard label="Productos" value={`${products.length} SKUs`} hint="Activos en el catálogo" icon={Boxes} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold">Producción de la semana</h3>
            <p className="text-sm text-muted-foreground">Edita la cantidad producida por SKU</p>
          </div>
          {dirty && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Cambios sin guardar</span>}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Semana anterior</TableHead>
              <TableHead className="text-right">Variación</TableHead>
              <TableHead className="w-[160px] text-right">Cantidad actual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const v = values[p.id] ?? 0
              const diff = v - p.prevWeek
              return (
                <TableRow key={p.id}>
                  <TableCell><ProductCell product={p} /></TableCell>
                  <TableCell><SkuTag sku={p.sku} /></TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">{formatNumber(p.prevWeek)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("tabular inline-flex items-center gap-0.5 text-xs font-semibold", diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-muted-foreground")}>
                      {diff > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : diff < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
                      {diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${diff}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <input
                      type="number" min={0} value={v}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setValues((s) => ({ ...s, [p.id]: Math.max(0, Number(e.target.value || 0)) }))}
                      className={cn(
                        "tabular h-10 w-28 rounded-lg border bg-white px-3 text-right text-sm font-semibold shadow-soft outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10",
                        v !== p.weekProduction ? "border-amber-300 bg-amber-50/40" : "border-input"
                      )}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="py-4 text-sm">Total producción</TableCell>
              <TableCell className="py-4 text-right">
                <span className="tabular text-xl font-extrabold">{formatNumber(total)}</span>
                <span className="ml-1 text-sm font-medium text-muted-foreground">unidades</span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <div className="flex flex-col-reverse gap-2 border-t p-5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={usePrevious}><History /> Usar cantidades de la semana pasada</Button>
          <Button onClick={save}><Save /> Guardar producción</Button>
        </div>
      </Card>
    </>
  )
}
