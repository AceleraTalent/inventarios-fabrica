export type Product = {
  id: string
  name: string
  sku: string
  unit: string
  cost: number
  price: number
  factory: number
  transit: number
  store: number
  sold: number
  /** unidades producidas la semana anterior (referencia para la carga semanal) */
  prevWeek: number
  /** unidades cargadas como producción de la semana actual */
  weekProduction: number
  image?: string
}

export type ShipmentStatus = "in_transit" | "received"

export type ShipmentItem = { productId: string; qty: number }

export type Shipment = {
  id: string
  date: string
  eta: string
  status: ShipmentStatus
  items: ShipmentItem[]
}

export type Sale = {
  id: string
  date: string
  time: string
  productId: string
  qty: number
  unitPrice: number
}

export type Stage = "factory" | "transit" | "store" | "sold"

export type StockStatus = "normal" | "low" | "out"

export type Page = "dashboard" | "factory" | "store" | "transit" | "sales" | "demand" | "products" | "reports" | "settings"
