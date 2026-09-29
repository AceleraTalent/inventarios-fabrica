import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Percent, Receipt, TrendingUp, Wallet } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard, PageHeader, ProductThumb } from "@/components/shared"
import { formatMoney, formatMoneyShort, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

const STAGE_COLORS = { Fábrica: "#2f9e44", "En tránsito": "#7cc98a", Tienda: "#b9e3c0", Vendido: "#e3ebe5" }

export function ReportsPage() {
  const { products } = useInventory()
  const revenue = products.reduce((a, p) => a + p.sold * p.price, 0)
  const cogs = products.reduce((a, p) => a + p.sold * p.cost, 0)
  const margin = revenue ? ((revenue - cogs) / revenue) * 100 : 0
  const sellThrough = (() => {
    const sold = products.reduce((a, p) => a + p.sold, 0)
    const store = products.reduce((a, p) => a + p.store, 0)
    return sold + store ? (sold / (sold + store)) * 100 : 0
  })()

  const data = products.map((p) => ({ name: p.name, Fábrica: p.factory, "En tránsito": p.transit, Tienda: p.store, Vendido: p.sold }))
  const top = [...products].sort((a, b) => b.sold * b.price - a.sold * a.price).slice(0, 5)
  const maxRev = Math.max(1, ...top.map((p) => p.sold * p.price))

  return (
    <>
      <PageHeader title="Reportes" subtitle="Resumen de desempeño de la semana" />
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ingresos" value={formatMoneyShort(revenue)} hint={formatMoney(revenue)} icon={Wallet} />
        <MetricCard label="Costo de ventas" value={formatMoneyShort(cogs)} hint={formatMoney(cogs)} icon={Receipt} />
        <MetricCard label="Margen bruto" value={`${margin.toFixed(1)}%`} hint={formatMoney(revenue - cogs)} icon={Percent} />
        <MetricCard label="Sell-through" value={`${sellThrough.toFixed(0)}%`} hint="Vendido / (vendido + tienda)" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-col sm:flex-row">
            <div>
              <CardTitle>Unidades por etapa</CardTitle>
              <CardDescription className="mt-0.5">Distribución de cada producto en el flujo</CardDescription>
            </div>
            <div className="flex flex-wrap gap-4">
              {Object.entries(STAGE_COLORS).map(([k, c]) => (
                <span key={k} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{k}</span>
              ))}
            </div>
          </CardHeader>
          <div className="h-[320px] px-3 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barSize={22}>
                <CartesianGrid vertical={false} stroke="#eef0f3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8a93a3" }} interval={0} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8a93a3" }} />
                <Tooltip cursor={{ fill: "#f4f6f8" }} contentStyle={{ borderRadius: 12, border: "1px solid #e5e8ec", fontSize: 12, boxShadow: "0 8px 24px -8px rgba(16,24,40,.12)" }} />
                {Object.entries(STAGE_COLORS).map(([k, c], i, arr) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={c} radius={i === arr.length - 1 ? [6, 6, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top productos</CardTitle>
              <CardDescription className="mt-0.5">Por ingresos de la semana</CardDescription>
            </div>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            {top.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-4 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <ProductThumb product={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="tabular font-bold">{formatMoneyShort(p.sold * p.price)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${((p.sold * p.price) / maxRev) * 100}%` }} />
                    </div>
                    <span className="tabular text-[11px] text-muted-foreground">{formatNumber(p.sold)} u.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
