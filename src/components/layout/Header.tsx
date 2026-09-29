import { useState } from "react"
import { Bell, Factory, Menu, Search, ShoppingBag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SidebarNav } from "./Sidebar"
import { useInventory } from "@/store/inventory"

export function Header() {
  const { openModal, products, stockStatus } = useInventory()
  const [menu, setMenu] = useState(false)
  const alerts = products.filter((p) => stockStatus(p) !== "normal").length

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenu(true)}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative hidden max-w-sm flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar producto o SKU…"
            className="h-10 w-full rounded-xl border border-transparent bg-muted/70 pl-9 pr-14 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border bg-white px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Ctrl /</kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => openModal({ type: "production" })}>
            <Factory /> <span className="hidden xl:inline">Registrar producción</span>
          </Button>
          <Button variant="outline" onClick={() => openModal({ type: "ship" })}>
            <Truck /> <span className="hidden xl:inline">Enviar a tienda</span>
          </Button>
          <Button onClick={() => openModal({ type: "sale" })}>
            <ShoppingBag /> <span className="hidden sm:inline">Registrar venta</span>
          </Button>

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="relative hidden h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground sm:flex">
                <Bell className="h-[18px] w-[18px]" />
                {alerts > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{alerts} productos con stock bajo en tienda</TooltipContent>
          </Tooltip>

          <div className="hidden items-center gap-2.5 pl-1 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-primary text-sm font-bold text-white">AD</div>
            <div className="hidden leading-tight 2xl:block">
              <p className="text-sm font-semibold">Admin</p>
              <p className="text-[11px] text-muted-foreground">Andina Foods</p>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SidebarNav onNavigate={() => setMenu(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
