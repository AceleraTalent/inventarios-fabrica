import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { TODAY, initialProducts, initialSales, initialShipments } from "@/data/mock"
import { todayLabel } from "@/lib/utils"
import type { Page, Product, Sale, Shipment, ShipmentItem, Stage, StockStatus } from "@/data/types"

export type ModalState =
  | { type: "production"; productId?: string }
  | { type: "ship" }
  | { type: "sale"; productId?: string }
  | { type: "product"; productId?: string }
  | null

type Ctx = {
  products: Product[]
  shipments: Shipment[]
  sales: Sale[]
  history: HistoryEvent[]
  lowStockThreshold: number
  companyName: string
  // navegación / ui
  page: Page
  /** producto seleccionado en el dashboard ("all" = todos) */
  filter: string
  setFilter: (id: string) => void
  setPage: (p: Page) => void
  modal: ModalState
  openModal: (m: ModalState) => void
  closeModal: () => void
  drawer: { kind: "product"; id: string } | { kind: "stage"; stage: Stage } | null
  openProduct: (id: string) => void
  openStage: (stage: Stage) => void
  closeDrawer: () => void
  // acciones
  addProduction: (productId: string, qty: number) => void
  saveWeeklyProduction: (values: Record<string, number>) => void
  createShipment: (items: ShipmentItem[]) => string
  receiveShipment: (id: string) => void
  /** Devuelve false si la cantidad no es válida (entero > 0 y ≤ stock de tienda). */
  registerSale: (productId: string, qty: number) => boolean
  upsertProduct: (data: Pick<Product, "name" | "sku" | "unit" | "cost" | "price">, id?: string) => void
  updateSettings: (s: { lowStockThreshold: number; companyName: string }) => void
  // helpers
  getProduct: (id: string) => Product | undefined
  stockStatus: (p: Product) => StockStatus
}

/** Evento real registrado en esta sesión (se muestra en el historial del producto). */
export type HistoryEvent = { id: string; productId: string; date: string; type: string; detail: string; tone: "sold" }

const InventoryContext = createContext<Ctx | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(initialProducts)
  const [shipments, setShipments] = useState(initialShipments)
  const [sales, setSales] = useState(initialSales)
  const [history, setHistory] = useState<HistoryEvent[]>([])
  const [lowStockThreshold, setLowStock] = useState(10)
  const [companyName, setCompanyName] = useState("Andina Foods")
  const [page, setPageState] = useState<Page>("dashboard")
  const [modal, setModal] = useState<ModalState>(null)
  const [drawer, setDrawer] = useState<Ctx["drawer"]>(null)
  const [filter, setFilter] = useState("all")

  const patch = (id: string, fn: (p: Product) => Partial<Product>) =>
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...fn(p) } : p)))

  const setPage = useCallback((p: Page) => {
    setPageState(p)
    window.scrollTo({ top: 0 })
  }, [])

  const addProduction = (productId: string, qty: number) =>
    patch(productId, (p) => ({ factory: p.factory + qty, weekProduction: p.weekProduction + qty }))

  const saveWeeklyProduction = (values: Record<string, number>) =>
    setProducts((ps) =>
      ps.map((p) => {
        const next = values[p.id]
        if (next === undefined) return p
        const delta = next - p.weekProduction
        return { ...p, weekProduction: next, factory: Math.max(0, p.factory + delta) }
      })
    )

  const createShipment = (items: ShipmentItem[]) => {
    const nextNum = Math.max(0, ...shipments.map((s) => Number(s.id.split("-")[1]))) + 1
    const id = `ENV-${String(nextNum).padStart(3, "0")}`
    setShipments((ss) => [{ id, date: TODAY, eta: "29 Sep", status: "in_transit", items }, ...ss])
    setProducts((ps) =>
      ps.map((p) => {
        const it = items.find((i) => i.productId === p.id)
        return it ? { ...p, factory: p.factory - it.qty, transit: p.transit + it.qty } : p
      })
    )
    return id
  }

  const receiveShipment = (id: string) => {
    const sh = shipments.find((s) => s.id === id)
    if (!sh || sh.status === "received") return
    setShipments((ss) => ss.map((s) => (s.id === id ? { ...s, status: "received" } : s)))
    setProducts((ps) =>
      ps.map((p) => {
        const it = sh.items.find((i) => i.productId === p.id)
        return it ? { ...p, transit: Math.max(0, p.transit - it.qty), store: p.store + it.qty } : p
      })
    )
  }

  const registerSale = (productId: string, qty: number) => {
    const p = products.find((x) => x.id === productId)
    // Solo tienda y vendido cambian; fábrica y tránsito nunca se tocan.
    if (!p || !Number.isInteger(qty) || qty <= 0 || qty > p.store) return false
    patch(productId, (x) => ({ store: x.store - qty, sold: x.sold + qty }))
    const now = new Date()
    const date = todayLabel(now)
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    setSales((ss) => {
      const n = Math.max(...ss.map((s) => Number(s.id.split("-")[1])), 1000) + 1
      return [{ id: `V-${n}`, date, time, productId, qty, unitPrice: p.price }, ...ss]
    })
    setHistory((h) => [{ id: `h${now.getTime()}`, productId, date, type: "Venta", detail: `-${qty} tienda`, tone: "sold" }, ...h])
    return true
  }

  const upsertProduct: Ctx["upsertProduct"] = (data, id) => {
    if (id) return patch(id, () => data)
    setProducts((ps) => [
      ...ps,
      { ...data, id: `p${Date.now()}`, factory: 0, transit: 0, store: 0, sold: 0, prevWeek: 0, weekProduction: 0 },
    ])
  }

  const updateSettings = (s: { lowStockThreshold: number; companyName: string }) => {
    setLowStock(s.lowStockThreshold)
    setCompanyName(s.companyName)
  }

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products])
  const stockStatus = useCallback(
    (p: Product): StockStatus => (p.store <= 0 ? "out" : p.store <= lowStockThreshold ? "low" : "normal"),
    [lowStockThreshold]
  )

  const value: Ctx = {
    products, shipments, sales, history, lowStockThreshold, companyName,
    page, setPage, filter, setFilter, modal, openModal: setModal, closeModal: () => setModal(null),
    drawer,
    openProduct: (id) => setDrawer({ kind: "product", id }),
    openStage: (stage) => setDrawer({ kind: "stage", stage }),
    closeDrawer: () => setDrawer(null),
    addProduction, saveWeeklyProduction, createShipment, receiveShipment, registerSale, upsertProduct, updateSettings,
    getProduct, stockStatus,
  }

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error("useInventory debe usarse dentro de InventoryProvider")
  return ctx
}

/** Totales por etapa para un conjunto de productos. */
export function useStageTotals(list: Product[]) {
  return useMemo(
    () =>
      list.reduce(
        (a, p) => ({ factory: a.factory + p.factory, transit: a.transit + p.transit, store: a.store + p.store, sold: a.sold + p.sold }),
        { factory: 0, transit: 0, store: 0, sold: 0 }
      ),
    [list]
  )
}
