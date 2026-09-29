import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const nf = new Intl.NumberFormat("es-CO")

export const formatNumber = (n: number) => nf.format(n)
export const formatMoney = (n: number) => `$${nf.format(Math.round(n))}`

/** $1.2M / $450K style for compact metric cards */
export const formatMoneyShort = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(".", ",")}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return formatMoney(n)
}

export const marginPct = (cost: number, price: number) => (price > 0 ? ((price - cost) / price) * 100 : 0)

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

/** Fecha actual en formato corto: "28 Sep" */
export const todayLabel = (d = new Date()) => `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`
