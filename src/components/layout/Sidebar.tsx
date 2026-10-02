import { BarChart3, CalendarRange, Factory, LayoutDashboard, Package, Receipt, Settings, Store, Truck, type LucideIcon } from "lucide-react"
import { useInventory } from "@/store/inventory"
import type { Page } from "@/data/types"
import { cn } from "@/lib/utils"

type Item = { page: Page; label: string; icon: LucideIcon }
const NAV: { section?: string; items: Item[] }[] = [
  { items: [{ page: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { section: "Inventario", items: [{ page: "factory", label: "Fábrica", icon: Factory }, { page: "store", label: "Tienda", icon: Store }] },
  { section: "Movimientos", items: [{ page: "transit", label: "En tránsito", icon: Truck }, { page: "sales", label: "Ventas", icon: Receipt }] },
  { section: "Planificación", items: [{ page: "demand", label: "Planeación de demanda", icon: CalendarRange }] },
  { section: "Catálogo", items: [{ page: "products", label: "Productos", icon: Package }, { page: "reports", label: "Reportes", icon: BarChart3 }, { page: "settings", label: "Configuración", icon: Settings }] },
]

export function Logo({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold tracking-tight">{name}</p>
        <p className="text-[11px] font-medium text-muted-foreground">Inventario</p>
      </div>
    </div>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { page, setPage, shipments, companyName } = useInventory()
  const active = shipments.filter((s) => s.status === "in_transit").length

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-6">
        <Logo name={companyName} />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-4">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.section}</p>}
            <div className="space-y-0.5">
              {group.items.map(({ page: p, label, icon: Icon }) => {
                const isActive = page === p
                return (
                  <button
                    key={p}
                    onClick={() => { setPage(p); onNavigate?.() }}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-primary-soft text-primary" : "text-slate-600 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isActive && <span className="absolute -left-4 top-2 bottom-2 w-1 rounded-r-full bg-primary" />}
                    <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={1.8} />
                    <span className="flex-1 text-left">{label}</span>
                    {p === "transit" && active > 0 && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600")}>{active}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="m-4 rounded-2xl border border-border/70 bg-gradient-to-br from-primary-soft to-white p-4">
        <p className="text-sm font-bold">Flujo del producto</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Fábrica → En tránsito → Tienda → Vendido</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-border/70 bg-white lg:block">
      <SidebarNav />
    </aside>
  )
}
