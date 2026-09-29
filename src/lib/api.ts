import type { Product, Sale, Shipment, ShipmentItem, Stage } from "@/data/types"
import { todayLabel } from "@/lib/utils"

export type HistoryEvent = { id: string; productId: string; date: string; type: string; detail: string; tone: Stage }

export type AppData = {
  products: Product[]
  shipments: Shipment[]
  sales: Sale[]
  history: HistoryEvent[]
  settings: { companyName: string; lowStockThreshold: number }
}

export type Action =
  | { action: "production"; productId: string; qty: number }
  | { action: "weeklyProduction"; values: Record<string, number> }
  | { action: "ship"; items: ShipmentItem[] }
  | { action: "receive"; id: string }
  | { action: "sale"; productId: string; qty: number }
  | { action: "product"; id?: string; name: string; sku: string; unit: string; cost: number; price: number }
  | { action: "settings"; companyName: string; lowStockThreshold: number }

type Raw = {
  products: Product[]
  shipments: { id: string; status: Shipment["status"]; createdAt: string; items: ShipmentItem[] }[]
  sales: { id: string; productId: string; qty: number; unitPrice: number; createdAt: string }[]
  history: { id: string; productId: string; type: string; detail: string; tone: Stage; createdAt: string }[]
  settings: AppData["settings"]
}

const ENDPOINT = "/api/inventory"
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`

/** Convierte fechas ISO del servidor al formato de la UI ("28 Sep", "14:05"). */
function normalize(raw: Raw): AppData {
  return {
    products: raw.products,
    shipments: raw.shipments.map((s) => {
      const d = new Date(s.createdAt)
      return { id: s.id, status: s.status, items: s.items, date: todayLabel(d), eta: todayLabel(new Date(d.getTime() + 864e5)) }
    }),
    sales: raw.sales.map((s) => {
      const d = new Date(s.createdAt)
      return { id: s.id, productId: s.productId, qty: s.qty, unitPrice: s.unitPrice, date: todayLabel(d), time: hhmm(d) }
    }),
    history: raw.history.map((h) => ({ id: h.id, productId: h.productId, type: h.type, detail: h.detail, tone: h.tone, date: todayLabel(new Date(h.createdAt)) })),
    settings: raw.settings,
  }
}

async function parse(res: Response) {
  const text = await res.text()
  if (!res.headers.get("content-type")?.includes("application/json")) throw new Error("API no disponible")
  const body = JSON.parse(text)
  if (!res.ok) throw new Error(body.error ?? "Error de servidor")
  return { data: normalize(body as Raw), text }
}

/** Devuelve también el texto crudo para detectar si algo cambió sin re-renderizar. */
export async function fetchState() {
  return parse(await fetch(ENDPOINT, { cache: "no-store" }))
}

export async function sendAction(action: Action) {
  return parse(await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(action) }))
}
