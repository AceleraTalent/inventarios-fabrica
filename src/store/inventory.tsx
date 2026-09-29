import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { initialProducts, initialSales, initialShipments, productHistory } from "@/data/mock"
import { fetchState, sendAction, type Action, type AppData, type HistoryEvent } from "@/lib/api"
import { todayLabel } from "@/lib/utils"
import type { Page, Product, Sale, Shipment, ShipmentItem, Stage, StockStatus } from "@/data/types"

export type { HistoryEvent }

export type ModalState =
  | { type: "production"; productId?: string }
  | { type: "ship" }
  | { type: "sale"; productId?: string }
  | { type: "product"; productId?: string }
  | null

/** loading: cargando desde Neon · online: datos compartidos · offline: sin API, datos de ejemplo locales */
export type Connection = "loading" | "online" | "offline"

type Ctx = {
  products: Product[]
  shipments: Shipment[]
  sales: Sale[]
  history: HistoryEvent[]
  lowStockThreshold: number
  companyName: string
  connection: Connection
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

const InventoryContext = createContext<Ctx | null>(null)

const POLL_MS = 4000

/** Datos de ejemplo para cuando no hay API (p. ej. `npm run dev` sin Vercel). */
const offlineData = (): AppData => ({
  products: initialProducts,
  shipments: initialShipments,
  sales: initialSales,
  history: initialProducts.flatMap((p) => productHistory(p).map((h, i) => ({ ...h, id: `${p.id}-${i}`, productId: p.id }))),
  settings: { companyName: "Andina Foods", lowStockThreshold: 10 },
})

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(offlineData)
  const [connection, setConnection] = useState<Connection>("loading")
  const [page, setPageState] = useState<Page>("dashboard")
  const [modal, setModal] = useState<ModalState>(null)
  const [drawer, setDrawer] = useState<Ctx["drawer"]>(null)
  const [filter, setFilter] = useState("all")

  const { products, shipments, sales, history, settings } = data
  const online = connection === "online"
  const lastText = useRef("")
  const pending = useRef(0)

  /* ── sincronización con Neon ── */

  const applyServer = useCallback((res: { data: AppData; text: string }) => {
    if (res.text === lastText.current) return // nada cambió: evita re-render
    lastText.current = res.text
    setData(res.data)
  }, [])

  const refresh = useCallback(async () => {
    if (pending.current > 0) return
    try {
      const res = await fetchState()
      if (pending.current === 0) applyServer(res)
      setConnection("online")
    } catch {
      setConnection((c) => (c === "loading" ? "offline" : c))
    }
  }, [applyServer])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    // Al volver a la pestaña o a la ventana, sincroniza de inmediato
    const onFocus = () => document.visibilityState === "visible" && refresh()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [refresh])

  /** Actualiza la UI al instante y guarda en Neon; si el servidor rechaza, revierte con su estado real. */
  const commit = (action: Action, optimistic: (d: AppData) => AppData) => {
    setData(optimistic)
    if (!online) return
    pending.current++
    sendAction(action)
      .then((res) => { pending.current--; if (pending.current === 0) applyServer(res) })
      .catch((e: Error) => {
        pending.current--
        toast.error("No se pudo guardar el movimiento", { description: e.message })
        lastText.current = ""
        refresh()
      })
  }

  /* ── helpers de actualización local ── */

  const mapProducts = (d: AppData, fn: (p: Product) => Product): AppData => ({ ...d, products: d.products.map(fn) })
  const addHistory = (d: AppData, events: Omit<HistoryEvent, "id" | "date">[]): AppData => {
    const now = Date.now()
    return { ...d, history: [...events.map((e, i) => ({ ...e, id: `tmp-${now}-${i}`, date: todayLabel() })), ...d.history] }
  }

  const setPage = useCallback((p: Page) => {
    setPageState(p)
    window.scrollTo({ top: 0 })
  }, [])

  /* ── acciones ── */

  const addProduction = (productId: string, qty: number) =>
    commit({ action: "production", productId, qty }, (d) =>
      addHistory(
        mapProducts(d, (p) => (p.id === productId ? { ...p, factory: p.factory + qty, weekProduction: p.weekProduction + qty } : p)),
        [{ productId, type: "Producción", detail: `+${qty} fábrica`, tone: "factory" }]
      )
    )

  const saveWeeklyProduction = (values: Record<string, number>) =>
    commit({ action: "weeklyProduction", values }, (d) => {
      const events: Omit<HistoryEvent, "id" | "date">[] = []
      const next = mapProducts(d, (p) => {
        const v = values[p.id]
        if (v === undefined || v === p.weekProduction) return p
        const delta = v - p.weekProduction
        events.push({ productId: p.id, type: "Producción", detail: `${delta > 0 ? "+" : ""}${delta} fábrica`, tone: "factory" })
        return { ...p, weekProduction: v, factory: Math.max(0, p.factory + delta) }
      })
      return addHistory(next, events)
    })

  const createShipment = (items: ShipmentItem[]) => {
    const nextNum = Math.max(0, ...shipments.map((s) => Number(s.id.split("-")[1]))) + 1
    const id = `ENV-${String(nextNum).padStart(3, "0")}`
    commit({ action: "ship", items }, (d) => {
      const next = mapProducts(d, (p) => {
        const it = items.find((i) => i.productId === p.id)
        return it ? { ...p, factory: p.factory - it.qty, transit: p.transit + it.qty } : p
      })
      const shipment: Shipment = { id, date: todayLabel(), eta: todayLabel(new Date(Date.now() + 864e5)), status: "in_transit", items }
      return addHistory({ ...next, shipments: [shipment, ...next.shipments] }, items.flatMap((i) => [
        { productId: i.productId, type: "Transferencia", detail: `-${i.qty} fábrica`, tone: "factory" as const },
        { productId: i.productId, type: "En tránsito", detail: `+${i.qty}`, tone: "transit" as const },
      ]))
    })
    return id
  }

  const receiveShipment = (id: string) => {
    const sh = shipments.find((s) => s.id === id)
    if (!sh || sh.status === "received") return
    commit({ action: "receive", id }, (d) => {
      const next = mapProducts(d, (p) => {
        const it = sh.items.find((i) => i.productId === p.id)
        return it ? { ...p, transit: Math.max(0, p.transit - it.qty), store: p.store + it.qty } : p
      })
      return addHistory(
        { ...next, shipments: next.shipments.map((s) => (s.id === id ? { ...s, status: "received" } : s)) },
        sh.items.map((i) => ({ productId: i.productId, type: "Recepción", detail: `+${i.qty} tienda`, tone: "store" as const }))
      )
    })
  }

  const registerSale = (productId: string, qty: number) => {
    const p = products.find((x) => x.id === productId)
    // Solo tienda y vendido cambian; fábrica y tránsito nunca se tocan.
    if (!p || !Number.isInteger(qty) || qty <= 0 || qty > p.store) return false
    commit({ action: "sale", productId, qty }, (d) => {
      const now = new Date()
      const n = Math.max(...d.sales.map((s) => Number(s.id.split("-")[1])), 1000) + 1
      const sale: Sale = { id: `V-${n}`, date: todayLabel(now), time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, productId, qty, unitPrice: p.price }
      const next = mapProducts(d, (x) => (x.id === productId ? { ...x, store: x.store - qty, sold: x.sold + qty } : x))
      return addHistory({ ...next, sales: [sale, ...next.sales] }, [{ productId, type: "Venta", detail: `-${qty} tienda`, tone: "sold" }])
    })
    return true
  }

  const upsertProduct: Ctx["upsertProduct"] = (fields, id) =>
    commit({ action: "product", id, ...fields }, (d) =>
      id
        ? mapProducts(d, (p) => (p.id === id ? { ...p, ...fields } : p))
        : { ...d, products: [...d.products, { ...fields, id: `tmp-${Date.now()}`, factory: 0, transit: 0, store: 0, sold: 0, prevWeek: 0, weekProduction: 0 }] }
    )

  const updateSettings = (s: { lowStockThreshold: number; companyName: string }) =>
    commit({ action: "settings", ...s }, (d) => ({ ...d, settings: s }))

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products])
  const stockStatus = useCallback(
    (p: Product): StockStatus => (p.store <= 0 ? "out" : p.store <= settings.lowStockThreshold ? "low" : "normal"),
    [settings.lowStockThreshold]
  )

  const value: Ctx = {
    products, shipments, sales, history,
    lowStockThreshold: settings.lowStockThreshold, companyName: settings.companyName, connection,
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
