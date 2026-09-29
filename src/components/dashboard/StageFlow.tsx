import { ArrowRight, ChevronRight } from "lucide-react"
import { STAGES } from "@/components/shared"
import { cn, formatMoneyShort, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"
import type { Product, Stage } from "@/data/types"

const ORDER: Stage[] = ["factory", "transit", "store", "sold"]

export function StageFlow({ list }: { list: Product[] }) {
  const { openStage, shipments } = useInventory()
  const ids = new Set(list.map((p) => p.id))
  const t = list.reduce(
    (a, p) => ({
      factory: a.factory + p.factory, transit: a.transit + p.transit, store: a.store + p.store, sold: a.sold + p.sold,
      prev: a.prev + p.prevWeek, week: a.week + p.weekProduction,
      storeValue: a.storeValue + p.store * p.price, revenue: a.revenue + p.sold * p.price,
    }),
    { factory: 0, transit: 0, store: 0, sold: 0, prev: 0, week: 0, storeValue: 0, revenue: 0 }
  )
  const flowTotal = t.factory + t.transit + t.store + t.sold || 1
  const active = shipments.filter((s) => s.status === "in_transit" && s.items.some((i) => ids.has(i.productId))).length
  const change = t.prev ? Math.round(((t.week - t.prev) / t.prev) * 100) : 0

  const secondary: Record<Stage, { text: string; tone?: "up" | "down" }> = {
    factory: { text: `${change >= 0 ? "+" : ""}${change}% vs sem. anterior`, tone: change >= 0 ? "up" : "down" },
    transit: { text: active === 1 ? "1 envío activo" : `${active} envíos activos` },
    store: { text: `${formatMoneyShort(t.storeValue)} en inventario` },
    sold: { text: `${formatMoneyShort(t.revenue)} en ventas` },
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:flex xl:items-stretch xl:gap-0">
      {ORDER.map((stage, i) => {
        const meta = STAGES[stage]
        const Icon = meta.icon
        const value = t[stage]
        const share = Math.round((value / flowTotal) * 100)
        const sec = secondary[stage]
        return (
          <div key={stage} className="contents">
            <button
              onClick={() => openStage(stage)}
              className="group relative flex flex-1 flex-col rounded-2xl border border-border/70 bg-white p-6 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} />
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground/60">0{i + 1}</span>
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{meta.label}</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="tabular text-[40px] font-extrabold leading-none tracking-tight">{formatNumber(value)}</span>
                <span className="text-sm font-medium text-muted-foreground">unidades</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{meta.description}</p>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${share}%` }} />
                </div>
                <span className="tabular text-xs font-semibold text-muted-foreground">{share}%</span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-border pt-4">
                <span className={cn("truncate text-xs font-semibold", sec.tone === "up" ? "text-emerald-600" : sec.tone === "down" ? "text-rose-600" : "text-slate-600")}>
                  {sec.text}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </button>

            {i < ORDER.length - 1 && <Connector />}
          </div>
        )
      })}
    </div>
  )
}

function Connector() {
  return (
    <div className="relative hidden w-12 shrink-0 items-center justify-center xl:flex">
      <svg className="absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2" preserveAspectRatio="none" viewBox="0 0 48 2">
        <line x1="0" y1="1" x2="48" y2="1" stroke="hsl(var(--primary))" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="4 6" className="animate-flow-dash" />
      </svg>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-soft">
        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
      </div>
    </div>
  )
}
