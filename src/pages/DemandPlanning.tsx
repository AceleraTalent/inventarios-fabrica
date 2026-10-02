import { useMemo, useState } from "react"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  Check,
  DollarSign,
  Lightbulb,
  Minus,
  PackageCheck,
  Percent,
  Plus,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MetricCard, ProductThumb, SkuTag } from "@/components/shared"
import { useInventory } from "@/store/inventory"
import { cn, formatMoney, formatNumber } from "@/lib/utils"
import type { Product } from "@/data/types"

type Scenario = "conservative" | "recommended" | "aggressive"

type DemandSeed = {
  sku: string
  history: [number, number, number, number]
  price: number
  cost: number
}

type PlanningRow = DemandSeed & {
  product: Product
  average: number
  trend: number
  projected: number
  planned: number
  revenue: number
  totalCost: number
  profit: number
  margin: number
}

const DEMAND_DATA: DemandSeed[] = [
  { sku: "HUE-001", history: [60, 64, 68, 72], price: 18000, cost: 11700 },
  { sku: "YOG-001", history: [42, 45, 47, 50], price: 12000, cost: 7200 },
  { sku: "ARA-001", history: [42, 40, 38, 35], price: 15000, cost: 9750 },
  { sku: "ARE-001", history: [61, 64, 67, 70], price: 10000, cost: 6500 },
  { sku: "LEC-001", history: [52, 55, 58, 60], price: 8000, cost: 5200 },
  { sku: "QUE-001", history: [34, 36, 39, 42], price: 22000, cost: 13200 },
  { sku: "GRA-001", history: [28, 29, 30, 30], price: 16000, cost: 9600 },
  { sku: "PAN-001", history: [49, 48, 46, 45], price: 9000, cost: 5850 },
  { sku: "MAN-001", history: [25, 26, 27, 27], price: 14000, cost: 8400 },
  { sku: "JUG-001", history: [18, 19, 19, 20], price: 11000, cost: 6600 },
]

const SCENARIOS: { id: Scenario; label: string; description: string; multiplier: number }[] = [
  { id: "conservative", label: "Conservador", description: "Proyección −10%", multiplier: 0.9 },
  { id: "recommended", label: "Recomendado", description: "Forecast normal", multiplier: 1 },
  { id: "aggressive", label: "Agresivo", description: "Proyección +10%", multiplier: 1.1 },
]

const scenarioMultiplier = (scenario: Scenario) => SCENARIOS.find((item) => item.id === scenario)?.multiplier ?? 1

const baseForecast = (history: DemandSeed["history"]) => {
  const weighted = history[0] * 0.1 + history[1] * 0.2 + history[2] * 0.3 + history[3] * 0.4
  const trend = history[2] ? ((history[3] - history[2]) / history[2]) * 100 : 0
  const trendFactor = trend > 2 ? 1.05 : trend < -2 ? 0.95 : 1
  return Math.round(weighted * trendFactor)
}

const initialPrices = () => Object.fromEntries(DEMAND_DATA.map((item) => [item.sku, item.price]))

const initialPlans = (scenario: Scenario) => Object.fromEntries(DEMAND_DATA.map((item) => [item.sku, Math.max(0, Math.round(baseForecast(item.history) * scenarioMultiplier(scenario)))]))

function MarginBadge({ margin }: { margin: number }) {
  if (margin > 35) return <Badge variant="success" dot>Margen saludable</Badge>
  if (margin >= 25) return <Badge variant="warning" dot>Revisar margen</Badge>
  return <Badge variant="danger" dot>Margen bajo</Badge>
}

function NumberControl({ value, onChange, step = 5, prefix }: { value: number; onChange: (value: number) => void; step?: number; prefix?: string }) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg border border-input bg-white shadow-soft focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
      <button type="button" aria-label="Disminuir" onClick={() => onChange(Math.max(0, value - step))} className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="h-3.5 w-3.5" /></button>
      <div className="flex h-full items-center border-x border-input px-2">
        {prefix ? <span className="mr-0.5 text-xs text-muted-foreground">{prefix}</span> : null}
        <input aria-label="Valor" type="number" value={value} onFocus={(event) => event.target.select()} onChange={(event) => onChange(Math.max(0, Number(event.target.value || 0)))} className={cn("tabular h-full bg-transparent text-center text-sm font-semibold outline-none", prefix ? "w-20" : "w-12")} />
      </div>
      <button type="button" aria-label="Aumentar" onClick={() => onChange(value + step)} className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  )
}

function ProductDrawer({ row, open, onClose, onPlanChange, onPriceChange }: { row?: PlanningRow; open: boolean; onClose: () => void; onPlanChange: (value: number) => void; onPriceChange: (value: number) => void }) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="sm:max-w-[500px]">
        {row ? (
          <>
            <div className="flex items-center gap-4 border-b px-7 pb-6 pt-7">
              <ProductThumb product={row.product} size="lg" />
              <div><SheetTitle className="text-xl">{row.product.name}</SheetTitle><SheetDescription asChild><div className="mt-1.5 flex items-center gap-2"><SkuTag sku={row.sku} /><span>{row.product.unit}</span></div></SheetDescription></div>
            </div>
            <div className="flex-1 space-y-7 overflow-y-auto px-7 py-6">
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Historial últimas semanas</p>
                <div className="grid grid-cols-4 gap-2">{row.history.map((value, index) => <div key={index} className="rounded-xl border bg-slate-50 p-3 text-center"><p className="text-[10px] text-muted-foreground">Semana {37 + index}</p><p className="tabular mt-1 text-xl font-extrabold">{value}</p><p className="text-[10px] text-muted-foreground">unidades</p></div>)}</div>
              </section>
              <section className="grid grid-cols-2 gap-3">
                <Card className="p-4 shadow-none"><p className="text-xs text-muted-foreground">Promedio</p><p className="mt-1 text-2xl font-extrabold">{row.average}</p></Card>
                <Card className="p-4 shadow-none"><p className="text-xs text-muted-foreground">Demanda proyectada</p><p className="mt-1 text-2xl font-extrabold text-primary">{row.projected}</p></Card>
              </section>
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Simulador de precio</p>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Precio</span><NumberControl value={row.price} onChange={onPriceChange} step={500} prefix="$" /></div>
                  <div className="mt-4 divide-y border-t text-sm">
                    <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Costo unitario</span><strong>{formatMoney(row.cost)}</strong></div>
                    <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Ingreso ({row.planned} unidades)</span><strong>{formatMoney(row.revenue)}</strong></div>
                    <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Costo total</span><strong>{formatMoney(row.totalCost)}</strong></div>
                    <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Utilidad bruta</span><strong>{formatMoney(row.profit)}</strong></div>
                    <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Margen</span><strong>{row.margin.toFixed(0)}%</strong></div>
                  </div>
                  <div className="mt-2"><MarginBadge margin={row.margin} /></div>
                </div>
              </section>
              <section>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ajustar planeación</p>
                <div className="flex items-center justify-between rounded-xl bg-primary-soft p-4"><div><p className="font-bold">Producción planeada</p><p className="text-xs text-muted-foreground">Recomendación: {row.projected} unidades</p></div><NumberControl value={row.planned} onChange={onPlanChange} /></div>
                <Coverage projected={row.projected} planned={row.planned} className="mt-3" />
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Coverage({ projected, planned, className }: { projected: number; planned: number; className?: string }) {
  const difference = planned - projected
  return (
    <div className={cn("rounded-lg px-3 py-2 text-xs", difference >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700", className)}>
      <span className="font-bold">{projected} <ArrowRight className="mx-1 inline h-3.5 w-3.5" /> {planned}</span>
      <span className="ml-2">{difference >= 0 ? `+${difference} unidades de cobertura` : `Faltan ${Math.abs(difference)} unidades para cubrir la demanda`}</span>
    </div>
  )
}

export function DemandPlanningPage() {
  const { products } = useInventory()
  const [scenario, setScenario] = useState<Scenario>("recommended")
  const [plans, setPlans] = useState<Record<string, number>>(() => initialPlans("recommended"))
  const [prices, setPrices] = useState<Record<string, number>>(initialPrices)
  const [selectedSku, setSelectedSku] = useState<string>()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const rows = useMemo<PlanningRow[]>(() => DEMAND_DATA.flatMap((seed) => {
    const product = products.find((item) => item.sku === seed.sku)
    if (!product) return []
    const average = Math.round(seed.history.reduce((sum, value) => sum + value, 0) / seed.history.length)
    const trend = seed.history[2] ? ((seed.history[3] - seed.history[2]) / seed.history[2]) * 100 : 0
    const projected = Math.max(0, Math.round(baseForecast(seed.history) * scenarioMultiplier(scenario)))
    const planned = plans[seed.sku] ?? projected
    const price = prices[seed.sku] ?? seed.price
    const revenue = planned * price
    const totalCost = planned * seed.cost
    const profit = revenue - totalCost
    return [{ ...seed, product, average, trend, projected, planned, price, revenue, totalCost, profit, margin: price > 0 ? ((price - seed.cost) / price) * 100 : 0 }]
  }), [plans, prices, products, scenario])

  const totals = useMemo(() => rows.reduce((total, row) => ({
    lastUnits: total.lastUnits + row.history[3],
    lastRevenue: total.lastRevenue + row.history[3] * row.price,
    units: total.units + row.planned,
    revenue: total.revenue + row.revenue,
    cost: total.cost + row.totalCost,
    profit: total.profit + row.profit,
  }), { lastUnits: 0, lastRevenue: 0, units: 0, revenue: 0, cost: 0, profit: 0 }), [rows])
  const totalMargin = totals.revenue ? (totals.profit / totals.revenue) * 100 : 0
  const growth = totals.lastRevenue ? ((totals.revenue - totals.lastRevenue) / totals.lastRevenue) * 100 : 0
  const selectedRow = rows.find((row) => row.sku === selectedSku)
  const chartData = [37, 38, 39, 40].map((week, index) => ({ week: `Semana ${week}`, ventas: rows.reduce((sum, row) => sum + row.history[index], 0), tipo: "Real" })).concat([{ week: "Semana 41", ventas: totals.units, tipo: "Proyección" }])

  const applyScenario = (next: Scenario) => {
    setScenario(next)
    setPlans(initialPlans(next))
  }
  const generatePlan = () => {
    setPlans(initialPlans(scenario))
    toast.success("Planeación generada", { description: "Se analizaron las últimas 4 semanas de ventas." })
  }
  const saveDraft = () => {
    localStorage.setItem("andina-demand-plan", JSON.stringify({ scenario, plans, prices }))
    toast.success("Planeación guardada correctamente")
  }
  const confirmProduction = () => {
    setConfirmOpen(false)
    window.setTimeout(() => toast.success("Planeación enviada a producción"), 50)
  }

  const rising = rows.reduce((best, row) => row.trend > (best?.trend ?? -Infinity) ? row : best, undefined as PlanningRow | undefined)
  const falling = rows.reduce((worst, row) => row.trend < (worst?.trend ?? Infinity) ? row : worst, undefined as PlanningRow | undefined)

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><h1 className="text-[26px] font-extrabold tracking-tight">Planeación de demanda</h1><p className="mt-1 text-sm text-muted-foreground">Proyección semanal basada en ventas reales</p></div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1.5"><span className="block text-xs font-semibold text-muted-foreground">Semana a planear</span><select className="h-10 rounded-lg border bg-white px-3 text-sm font-semibold shadow-soft outline-none focus:border-primary"><option>05 Oct – 11 Oct 2026</option></select></label>
          <div className="pb-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Datos utilizados:</span> Últimas 4 semanas de ventas</div>
          <Button onClick={generatePlan}><Sparkles /> Generar planeación</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ventas semana pasada" value={formatMoney(totals.lastRevenue)} hint={`${formatNumber(totals.lastUnits)} unidades vendidas`} icon={WalletCards} />
        <MetricCard label="Proyección próxima semana" value={formatMoney(totals.revenue)} hint={<span className={growth >= 0 ? "text-emerald-600" : "text-rose-600"}>{growth >= 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}% vs semana pasada</span>} icon={TrendingUp} />
        <MetricCard label="Unidades a producir" value={formatNumber(totals.units)} hint="Producción planeada" icon={PackageCheck} />
        <MetricCard label="Margen bruto estimado" value={`${totalMargin.toFixed(0)}%`} hint={totalMargin > 35 ? "Margen saludable" : "Revisar margen"} icon={Percent} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.55fr_.85fr]">
        <Card className="p-6">
          <div><h2 className="font-bold">Ventas vs proyección</h2><p className="mt-0.5 text-sm text-muted-foreground">Unidades vendidas durante las últimas semanas</p></div>
          <div className="mt-5 h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}><CartesianGrid vertical={false} stroke="#eef0f3" /><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8a93a3" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8a93a3" }} /><Tooltip formatter={(value: number, _name: string, entry: { payload?: { tipo?: string } }) => [`${value} unidades`, entry.payload?.tipo ?? "Ventas"]} contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb", fontSize: 12 }} /><Bar dataKey="ventas" radius={[7, 7, 0, 0]}>{chartData.map((item) => <Cell key={item.week} fill={item.tipo === "Proyección" ? "#2f9e44" : "#cbd5e1"} />)}</Bar></BarChart></ResponsiveContainer></div>
          <div className="mt-2 flex justify-end gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Ventas reales</span><span className="flex items-center gap-1.5 font-semibold text-primary"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Proyección</span></div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Lightbulb className="h-5 w-5" /></div><div><h2 className="font-bold">Insights de la semana</h2><p className="text-sm text-muted-foreground">Qué está cambiando</p></div></div>
          <div className="mt-5 space-y-3 text-sm">
            <p className="rounded-xl bg-slate-50 p-3"><strong>{rising?.product.name}</strong> creció {Math.abs(rising?.trend ?? 0).toFixed(0)}% en la última semana.</p>
            <p className="rounded-xl bg-slate-50 p-3"><strong>{falling?.product.name}</strong> muestra una caída de {Math.abs(falling?.trend ?? 0).toFixed(0)}%.</p>
            <p className="rounded-xl bg-slate-50 p-3">Se recomienda producir <strong>{formatNumber(totals.units)} unidades</strong> en total.</p>
            <p className="rounded-xl bg-primary-soft p-3 text-primary">Con esta planeación se proyectan <strong>{formatMoney(totals.revenue)}</strong> en ventas.</p>
          </div>
        </Card>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold">Plan recomendado por producto</h2><p className="mt-0.5 text-sm text-muted-foreground">Ventas → proyección → ajuste → producción</p></div>
          <div className="inline-flex w-fit rounded-xl border bg-slate-50 p-1">{SCENARIOS.map((item) => <button key={item.id} type="button" onClick={() => applyScenario(item.id)} className={cn("rounded-lg px-4 py-2 text-left transition", scenario === item.id ? "bg-white text-primary shadow-soft ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}><span className="block text-xs font-bold">{item.label}</span><span className="block text-[10px]">{item.description}</span></button>)}</div>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Ventas semana pasada</TableHead><TableHead className="text-right">Promedio 4 semanas</TableHead><TableHead className="text-right">Tendencia</TableHead><TableHead className="text-right">Demanda proyectada</TableHead><TableHead className="text-center">Ajuste / plan final</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Ingreso estimado</TableHead><TableHead>Margen</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((row) => (
            <TableRow key={row.sku} className="cursor-pointer" onClick={() => setSelectedSku(row.sku)}>
              <TableCell><div className="flex items-center gap-3"><ProductThumb product={row.product} /><div><p className="font-semibold">{row.product.name}</p><SkuTag sku={row.sku} /></div></div></TableCell>
              <TableCell className="tabular text-right font-semibold">{row.history[3]}</TableCell>
              <TableCell className="tabular text-right text-muted-foreground">{row.average}</TableCell>
              <TableCell className="text-right"><span className={cn("inline-flex items-center text-xs font-bold", row.trend > 1 ? "text-emerald-600" : row.trend < -1 ? "text-rose-600" : "text-muted-foreground")}>{row.trend > 1 ? <ArrowUpRight className="h-3.5 w-3.5" /> : row.trend < -1 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}{Math.abs(row.trend).toFixed(0)}%</span></TableCell>
              <TableCell className="text-right"><p className="tabular text-lg font-extrabold text-primary">{row.projected}</p><p className="text-[10px] text-muted-foreground">recomendadas</p></TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}><div className="flex flex-col items-center gap-1.5"><NumberControl value={row.planned} onChange={(value) => setPlans((current) => ({ ...current, [row.sku]: value }))} /><span className={cn("text-[10px] font-semibold", row.planned >= row.projected ? "text-emerald-600" : "text-rose-600")}>{row.planned >= row.projected ? `+${row.planned - row.projected} cobertura` : `Faltan ${row.projected - row.planned}`}</span></div></TableCell>
              <TableCell onClick={(event) => event.stopPropagation()} className="text-right"><div className="inline-flex items-center rounded-lg border bg-white px-2"><span className="text-xs text-muted-foreground">$</span><input aria-label={`Precio de ${row.product.name}`} type="number" value={row.price} onFocus={(event) => event.target.select()} onChange={(event) => setPrices((current) => ({ ...current, [row.sku]: Math.max(0, Number(event.target.value || 0)) }))} className="tabular h-9 w-20 bg-transparent text-right text-sm font-semibold outline-none" /></div></TableCell>
              <TableCell className="tabular text-right font-bold">{formatMoney(row.revenue)}</TableCell>
              <TableCell><div className="space-y-1"><span className="font-bold">{row.margin.toFixed(0)}%</span><div><MarginBadge margin={row.margin} /></div></div></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
        <div className="flex flex-col gap-3 border-t bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Haz clic en un producto para ver su historial y simular precio.</p><div className="flex gap-2"><Button variant="outline" onClick={saveDraft}><Save /> Guardar borrador</Button><Button onClick={() => setConfirmOpen(true)}><Check /> Confirmar planeación</Button></div></div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ingresos proyectados" value={formatMoney(totals.revenue)} hint={`${formatNumber(totals.units)} unidades`} icon={DollarSign} />
        <MetricCard label="Costos proyectados" value={formatMoney(totals.cost)} hint="Costos de producción" icon={WalletCards} />
        <MetricCard label="Utilidad bruta" value={formatMoney(totals.profit)} hint="Ingresos menos costos" icon={Target} />
        <MetricCard label="Margen bruto" value={`${totalMargin.toFixed(0)}%`} hint={totalMargin > 35 ? "Margen saludable" : "Revisar margen"} icon={Percent} />
      </div>

      <ProductDrawer row={selectedRow} open={Boolean(selectedRow)} onClose={() => setSelectedSku(undefined)} onPlanChange={(value) => selectedRow && setPlans((current) => ({ ...current, [selectedRow.sku]: value }))} onPriceChange={(value) => selectedRow && setPrices((current) => ({ ...current, [selectedRow.sku]: value }))} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Confirmar plan de producción</DialogTitle><DialogDescription>Revisa las cantidades antes de enviarlas a producción.</DialogDescription></DialogHeader><div className="max-h-[46vh] divide-y overflow-y-auto rounded-xl border">{rows.map((row) => <div key={row.sku} className="flex items-center justify-between px-4 py-2.5 text-sm"><span>{row.product.name}</span><strong>{row.planned} unidades</strong></div>)}</div><div className="flex items-center justify-between rounded-xl bg-primary-soft p-4"><span className="font-semibold text-primary">Total a producir</span><strong className="text-xl text-primary">{formatNumber(totals.units)} unidades</strong></div><DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button><Button onClick={confirmProduction}><CalendarRange /> Confirmar y enviar a producción</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  )
}
