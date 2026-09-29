import type { Product, Sale, Shipment } from "./types"

const img = (name: string) => `/products/${name}.jpg`

export const TODAY = "28 Sep"
export const CURRENT_WEEK = "28 Sep – 04 Oct"
export const PREVIOUS_WEEK = "21 – 27 Sep"

export const initialProducts: Product[] = [
  { id: "p1", name: "Huevos", sku: "HUE-001", unit: "Cubeta x30", cost: 8000, price: 12000, factory: 80, transit: 30, store: 42, sold: 28, prevWeek: 70, weekProduction: 80, image: img("huevos") },
  { id: "p2", name: "Yogur", sku: "YOG-001", unit: "Vaso 1 L", cost: 4500, price: 7200, factory: 50, transit: 20, store: 35, sold: 31, prevWeek: 45, weekProduction: 50, image: img("yogur") },
  { id: "p3", name: "Arándanos", sku: "ARA-001", unit: "Caja 125 g", cost: 6000, price: 9800, factory: 35, transit: 15, store: 8, sold: 22, prevWeek: 40, weekProduction: 35, image: img("arandanos") },
  { id: "p4", name: "Arepas", sku: "ARE-001", unit: "Paquete x5", cost: 2800, price: 4500, factory: 70, transit: 25, store: 50, sold: 38, prevWeek: 65, weekProduction: 70, image: img("arepas") },
  { id: "p5", name: "Leche", sku: "LEC-001", unit: "Bolsa 1 L", cost: 3200, price: 4800, factory: 60, transit: 0, store: 0, sold: 45, prevWeek: 60, weekProduction: 60, image: img("leche") },
  { id: "p6", name: "Queso", sku: "QUE-001", unit: "Bloque 500 g", cost: 11000, price: 16500, factory: 40, transit: 10, store: 18, sold: 12, prevWeek: 35, weekProduction: 40, image: img("queso") },
  { id: "p7", name: "Granola", sku: "GRA-001", unit: "Bolsa 500 g", cost: 7500, price: 12900, factory: 30, transit: 10, store: 6, sold: 14, prevWeek: 30, weekProduction: 30, image: img("granola") },
  { id: "p8", name: "Pan", sku: "PAN-001", unit: "Pan tajado", cost: 3500, price: 5900, factory: 45, transit: 15, store: 30, sold: 26, prevWeek: 50, weekProduction: 45, image: img("pan") },
  { id: "p9", name: "Mantequilla", sku: "MAN-001", unit: "Barra 250 g", cost: 5200, price: 8500, factory: 25, transit: 5, store: 22, sold: 9, prevWeek: 25, weekProduction: 25, image: img("mantequilla") },
  { id: "p10", name: "Jugo", sku: "JUG-001", unit: "Botella 1 L", cost: 4200, price: 6900, factory: 15, transit: 10, store: 20, sold: 15, prevWeek: 20, weekProduction: 15, image: img("jugo") },
]

// Los envíos "en tránsito" suman exactamente el stock en tránsito de cada producto.
export const initialShipments: Shipment[] = [
  {
    id: "ENV-004", date: "28 Sep", eta: "29 Sep", status: "in_transit",
    items: [
      { productId: "p1", qty: 30 }, { productId: "p2", qty: 20 }, { productId: "p3", qty: 15 },
      { productId: "p4", qty: 15 }, { productId: "p6", qty: 10 },
    ],
  },
  {
    id: "ENV-003", date: "27 Sep", eta: "29 Sep", status: "in_transit",
    items: [
      { productId: "p4", qty: 10 }, { productId: "p7", qty: 10 }, { productId: "p8", qty: 15 },
      { productId: "p9", qty: 5 }, { productId: "p10", qty: 10 },
    ],
  },
  {
    id: "ENV-002", date: "25 Sep", eta: "26 Sep", status: "received",
    items: [
      { productId: "p1", qty: 25 }, { productId: "p2", qty: 20 }, { productId: "p4", qty: 30 },
      { productId: "p5", qty: 25 }, { productId: "p8", qty: 20 }, { productId: "p10", qty: 15 },
    ],
  },
  {
    id: "ENV-001", date: "22 Sep", eta: "23 Sep", status: "received",
    items: [
      { productId: "p3", qty: 20 }, { productId: "p5", qty: 20 }, { productId: "p6", qty: 18 },
      { productId: "p7", qty: 12 }, { productId: "p9", qty: 15 },
    ],
  },
]

export const initialSales: Sale[] = [
  { id: "V-1042", date: "28 Sep", time: "11:24", productId: "p5", qty: 6, unitPrice: 4800 },
  { id: "V-1041", date: "28 Sep", time: "10:02", productId: "p1", qty: 4, unitPrice: 12000 },
  { id: "V-1040", date: "28 Sep", time: "09:15", productId: "p4", qty: 8, unitPrice: 4500 },
  { id: "V-1039", date: "27 Sep", time: "18:40", productId: "p2", qty: 5, unitPrice: 7200 },
  { id: "V-1038", date: "27 Sep", time: "16:12", productId: "p3", qty: 3, unitPrice: 9800 },
  { id: "V-1037", date: "27 Sep", time: "12:55", productId: "p8", qty: 7, unitPrice: 5900 },
  { id: "V-1036", date: "26 Sep", time: "17:31", productId: "p6", qty: 2, unitPrice: 16500 },
  { id: "V-1035", date: "26 Sep", time: "09:48", productId: "p10", qty: 4, unitPrice: 6900 },
]

export const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

// Patrones de reparto diario (suman ~1) para simular una semana realista.
const PATTERNS = {
  production: [0.2, 0.16, 0.14, 0.18, 0.16, 0.1, 0.06],
  shipments: [0.08, 0.2, 0.12, 0.2, 0.16, 0.18, 0.06],
  receptions: [0.04, 0.14, 0.2, 0.12, 0.2, 0.16, 0.14],
  sales: [0.1, 0.11, 0.12, 0.13, 0.16, 0.22, 0.16],
}

/** Serie semanal mock derivada de los totales actuales (y un poco más baja para la semana anterior). */
export function weeklySeries(products: Product[], week: "current" | "previous") {
  const k = week === "current" ? 1 : 0.86
  const tot = products.reduce(
    (a, p, i) => {
      const wobble = 1 + ((i % 3) - 1) * 0.06
      a.production += p.weekProduction * wobble
      a.shipments += (p.transit + p.store * 0.6) * wobble
      a.receptions += p.store * 0.75 * wobble
      a.sales += p.sold * wobble
      return a
    },
    { production: 0, shipments: 0, receptions: 0, sales: 0 }
  )
  return DAYS.map((day, d) => ({
    day,
    Producción: Math.round(tot.production * PATTERNS.production[d] * k),
    Envíos: Math.round(tot.shipments * PATTERNS.shipments[d] * k),
    Recepciones: Math.round(tot.receptions * PATTERNS.receptions[d] * k),
    Ventas: Math.round(tot.sales * PATTERNS.sales[d] * (week === "current" ? 1 : 0.92)),
  }))
}

/** Historial visual por producto (mock, sin lógica real). */
export function productHistory(p: Product) {
  const base = Math.max(10, Math.round(p.weekProduction / 2 / 5) * 5)
  const half = Math.max(5, Math.round(base / 2))
  return [
    { date: "26 Sep", type: "Venta", detail: `-${Math.max(2, Math.round(half / 2))} tienda`, tone: "sold" as const },
    { date: "25 Sep", type: "Recepción", detail: `+${half} tienda`, tone: "store" as const },
    { date: "24 Sep", type: "En tránsito", detail: `+${half}`, tone: "transit" as const },
    { date: "24 Sep", type: "Transferencia", detail: `-${half} fábrica`, tone: "factory" as const },
    { date: "23 Sep", type: "Producción", detail: `+${base} fábrica`, tone: "factory" as const },
  ]
}
