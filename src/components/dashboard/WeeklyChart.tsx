import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"

export const SERIES = [
  { key: "Producción", color: "#2f9e44" },
  { key: "Envíos", color: "#0ea5e9" },
  { key: "Recepciones", color: "#8b5cf6" },
  { key: "Ventas", color: "#f59e0b" },
] as const

type Row = { day: string } & Record<(typeof SERIES)[number]["key"], number>

export function WeeklyChart({ data, subtitle }: { data: Row[]; subtitle: string }) {
  const totals = SERIES.map((s) => ({ ...s, total: data.reduce((a, r) => a + r[s.key], 0) }))
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-col items-stretch gap-4">
        <div>
          <CardTitle>Movimiento semanal</CardTitle>
          <CardDescription className="mt-0.5">{subtitle}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {totals.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-xs text-muted-foreground">{s.key}</span>
              <span className="tabular text-xs font-bold">{formatNumber(s.total)}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <div className="relative min-h-[300px] flex-1">
        <div className="absolute inset-0 px-3 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="#eef0f3" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8a93a3" }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8a93a3" }} width={44} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#d7dbe2", strokeDasharray: "4 4" }} />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2.2}
                fill={`url(#g-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                animationDuration={600}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[160px] rounded-xl border border-border/80 bg-white p-3 shadow-lift">
      <p className="mb-2 text-xs font-bold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={p.dataKey as string} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.dataKey}
            </span>
            <span className="tabular font-semibold">{formatNumber(p.value as number)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
