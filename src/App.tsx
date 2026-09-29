import { Loader2 } from "lucide-react"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { GlobalModals } from "@/components/modals"
import { ProductDrawer } from "@/components/drawers/ProductDrawer"
import { StageDrawer } from "@/components/drawers/StageDrawer"
import { InventoryProvider, useInventory } from "@/store/inventory"
import { Dashboard } from "@/pages/Dashboard"
import { FactoryPage } from "@/pages/Factory"
import { StorePage } from "@/pages/StorePage"
import { TransitPage } from "@/pages/Transit"
import { SalesPage } from "@/pages/Sales"
import { ProductsPage } from "@/pages/Products"
import { ReportsPage } from "@/pages/Reports"
import { SettingsPage } from "@/pages/Settings"
import type { Page } from "@/data/types"

const PAGES: Record<Page, () => JSX.Element> = {
  dashboard: Dashboard,
  factory: FactoryPage,
  store: StorePage,
  transit: TransitPage,
  sales: SalesPage,
  products: ProductsPage,
  reports: ReportsPage,
  settings: SettingsPage,
}

function Shell() {
  const { page, connection } = useInventory()
  const Current = PAGES[page]
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-[256px]">
        <Header />
        <main key={page} className="mx-auto max-w-[1440px] px-4 py-8 animate-in fade-in duration-300 sm:px-6 lg:px-8">
          {connection === "loading" ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Cargando inventario…
            </div>
          ) : (
            <Current />
          )}
        </main>
      </div>
      <StageDrawer />
      <ProductDrawer />
      <GlobalModals />
    </div>
  )
}

export default function App() {
  return (
    <InventoryProvider>
      <TooltipProvider delayDuration={200}>
        <Shell />
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { fontFamily: "inherit", borderRadius: 14 } }} />
      </TooltipProvider>
    </InventoryProvider>
  )
}
