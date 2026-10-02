import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  Clock3,
  Factory,
  Gauge,
  PackagePlus,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Settings2,
  Timer,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ModalShell } from "@/components/modals/ModalShell"
import { MetricCard, ProductThumb, QtyInput, SkuTag } from "@/components/shared"
import { cn } from "@/lib/utils"

type ProductKey = "cheese" | "yogurt" | "butter"

type ProductDefinition = {
  key: ProductKey
  name: string
  presentation: string
  sku: string
  image: string
  capacity: number
  cycleHours: number
  ingredients: { name: string; perUnit: number; unit: string }[]
}

type LineState = ProductDefinition & {
  quantity: number
  elapsed: number
  remaining: number
  startElapsed: number
  startRemaining: number
}

const PRODUCTS: ProductDefinition[] = [
  {
    key: "cheese",
    name: "Queso",
    presentation: "Bloque 500 g",
    sku: "QUE-001",
    image: "/products/queso.jpg",
    capacity: 20,
    cycleHours: 6,
    ingredients: [
      { name: "Leche", perUnit: 5, unit: "L" },
      { name: "Cuajo", perUnit: 0.05, unit: "dosis" },
      { name: "Sal", perUnit: 0.1, unit: "kg" },
    ],
  },
  {
    key: "yogurt",
    name: "Yogur",
    presentation: "Vaso 1 L",
    sku: "YOG-001",
    image: "/products/yogur.jpg",
    capacity: 50,
    cycleHours: 4,
    ingredients: [
      { name: "Leche", perUnit: 1.04, unit: "L" },
      { name: "Cultivo", perUnit: 0.02, unit: "dosis" },
    ],
  },
  {
    key: "butter",
    name: "Mantequilla",
    presentation: "Barra 250 g",
    sku: "MAN-001",
    image: "/products/mantequilla.jpg",
    capacity: 30,
    cycleHours: 2,
    ingredients: [
      { name: "Crema", perUnit: 0.5, unit: "L" },
      { name: "Sal", perUnit: 0.0167, unit: "kg" },
    ],
  },
]

const INITIAL_PROGRESS: Record<ProductKey, { elapsed: number; remaining: number }> = {
  cheese: { elapsed: 4 * 3600, remaining: 2 * 3600 },
  yogurt: { elapsed: 1 * 3600 + 41 * 60, remaining: 2 * 3600 + 19 * 60 },
  butter: { elapsed: 36 * 60, remaining: 1 * 3600 + 24 * 60 },
}

const initialLines = (): LineState[] => PRODUCTS.map((product) => ({
  ...product,
  quantity: product.capacity,
  elapsed: INITIAL_PROGRESS[product.key].elapsed,
  remaining: INITIAL_PROGRESS[product.key].remaining,
  startElapsed: INITIAL_PROGRESS[product.key].elapsed,
  startRemaining: INITIAL_PROGRESS[product.key].remaining,
}))

const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":")
}

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours && minutes) return `${hours}h ${String(minutes).padStart(2, "0")}min`
  if (hours) return `${hours}h`
  return `${minutes}min`
}

const formatAmount = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(value < 1 ? 2 : 1).replace(/\.0$/, "")

const estimatedTime = (seconds: number) => {
  const date = new Date(Date.now() + seconds * 1000)
  return new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true }).format(date)
}

function ProductionLine({ line }: { line: LineState }) {
  const total = line.elapsed + line.remaining
  const progress = total === 0 ? 100 : Math.min(100, Math.round((line.elapsed / total) * 100))
  const finished = line.remaining === 0

  return (
    <article className="flex min-w-0 flex-col p-5 lg:border-r lg:last:border-r-0">
      <div className="flex items-center gap-3">
        <ProductThumb product={{ name: line.name, image: line.image }} size="lg" />
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold">{line.name}</h3>
          <p className="text-xs text-muted-foreground">{line.presentation}</p>
          <div className="mt-1"><SkuTag sku={line.sku} /></div>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="tabular text-2xl font-extrabold">{line.quantity} <span className="text-sm font-medium text-muted-foreground">unidades</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Capacidad por ciclo: {line.capacity}</p>
        </div>
        <span className="tabular text-lg font-extrabold text-primary">{progress}%</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4 text-center">
        <p className="tabular text-2xl font-extrabold tracking-wider">{formatClock(line.remaining)}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">restantes</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><p className="text-muted-foreground">Transcurrido</p><p className="mt-1 font-bold">{formatDuration(line.elapsed)}</p></div>
        <div><p className="text-muted-foreground">Tiempo total</p><p className="mt-1 font-bold">{formatDuration(total)}</p></div>
        <div><p className="text-muted-foreground">Finalización</p><p className="mt-1 font-bold">{finished ? "Terminada" : estimatedTime(line.remaining)}</p></div>
        <div><p className="text-muted-foreground">Estado</p><p className={cn("mt-1 font-bold", finished ? "text-emerald-600" : "text-primary")}>{finished ? "✓ Terminada" : "En producción"}</p></div>
      </div>

      <div className="mt-5 border-t pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Insumos utilizados</p>
        <div className="space-y-2">
          {line.ingredients.map((ingredient) => (
            <div key={ingredient.name} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{ingredient.name}</span>
              <span className="font-semibold">{formatAmount(ingredient.perUnit * line.quantity)} {ingredient.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

function NewProductionModal({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: (quantities: Record<ProductKey, number>, selected: Record<ProductKey, boolean>) => void }) {
  const [selected, setSelected] = useState<Record<ProductKey, boolean>>({ cheese: true, yogurt: true, butter: true })
  const [quantities, setQuantities] = useState<Record<ProductKey, number>>({ cheese: 20, yogurt: 50, butter: 30 })
  const chosen = PRODUCTS.filter((product) => selected[product.key])

  const totalUnits = chosen.reduce((sum, product) => sum + quantities[product.key], 0)
  const longestHours = Math.max(0, ...chosen.map((product) => product.cycleHours * quantities[product.key] / product.capacity))
  const supplies = chosen.flatMap((product) => product.ingredients.map((ingredient) => ({ ...ingredient, value: ingredient.perUnit * quantities[product.key] })))
    .reduce<Record<string, { value: number; unit: string }>>((result, item) => {
      const current = result[item.name] ?? { value: 0, unit: item.unit }
      result[item.name] = { ...current, value: current.value + item.value }
      return result
    }, {})

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={PackagePlus}
      title="Nueva producción"
      description="Configura una o varias líneas para iniciar en paralelo."
      className="max-h-[90vh] max-w-3xl overflow-y-auto"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={chosen.length === 0 || totalUnits === 0} onClick={() => onStart(quantities, selected)}><Play /> Iniciar ciclo</Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {PRODUCTS.map((product) => {
          const active = selected[product.key]
          const quantity = quantities[product.key]
          const hours = product.cycleHours * quantity / product.capacity
          return (
            <div key={product.key} className={cn("rounded-xl border p-4 transition", active ? "border-primary/30 bg-primary-soft/40" : "bg-muted/30 opacity-65")}>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={active} onChange={(event) => setSelected((current) => ({ ...current, [product.key]: event.target.checked }))} className="h-4 w-4 accent-primary" />
                <ProductThumb product={{ name: product.name, image: product.image }} />
                <span className="font-bold">{product.name}</span>
              </label>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Cantidad</span>
                <QtyInput value={quantity} min={1} onChange={(value) => setQuantities((current) => ({ ...current, [product.key]: value }))} />
              </div>
              <div className="mt-3 space-y-1.5 border-t pt-3 text-xs">
                <p className="flex justify-between"><span className="text-muted-foreground">Tiempo estimado</span><strong>{formatDuration(hours * 3600)}</strong></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Finalización</span><strong>{estimatedTime(hours * 3600)}</strong></p>
                {product.ingredients.map((ingredient) => <p key={ingredient.name} className="flex justify-between"><span className="text-muted-foreground">{ingredient.name}</span><strong>{formatAmount(ingredient.perUnit * quantity)} {ingredient.unit}</strong></p>)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5 shadow-none">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumen del ciclo</p>
          <div className="mt-3 space-y-2">
            {chosen.map((product) => {
              const hours = product.cycleHours * quantities[product.key] / product.capacity
              return <div key={product.key} className="flex items-center justify-between text-sm"><span className="font-semibold">{product.name}</span><span className="text-muted-foreground">{quantities[product.key]} unidades · {formatDuration(hours * 3600)}</span></div>
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Total a producir</p><p className="mt-1 text-xl font-extrabold">{totalUnits} <span className="text-xs font-medium">unidades</span></p></div>
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Tiempo total del turno</p><p className="mt-1 text-xl font-extrabold">{formatDuration(longestHours * 3600)}</p></div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Las líneas trabajan en paralelo; se toma el proceso más largo.</p>
        </Card>
        <Card className="p-5 shadow-none">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Insumos requeridos</p>
          <div className="mt-3 space-y-2.5">
            {Object.entries(supplies).map(([name, supply]) => <div key={name} className="flex justify-between text-sm"><span className="text-muted-foreground">{name}</span><strong>{formatAmount(supply.value)} {supply.unit}</strong></div>)}
          </div>
        </Card>
      </div>
    </ModalShell>
  )
}

export function MachinesPage() {
  const [lines, setLines] = useState<LineState[]>(initialLines)
  const [running, setRunning] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setLines((current) => {
        const next = current.map((line) => line.remaining > 0 ? { ...line, elapsed: line.elapsed + 1, remaining: line.remaining - 1 } : line)
        if (next.every((line) => line.remaining === 0)) setRunning(false)
        return next
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [running])

  const nextLine = useMemo(() => lines.filter((line) => line.remaining > 0).reduce<LineState | undefined>((next, line) => !next || line.remaining < next.remaining ? line : next, undefined), [lines])
  const producing = lines.filter((line) => line.remaining > 0).length

  const reset = () => {
    setRunning(false)
    setLines(initialLines())
    toast("Simulación reiniciada", { description: "Las tres líneas volvieron a su progreso inicial." })
  }

  const startNewCycle = (quantities: Record<ProductKey, number>, selected: Record<ProductKey, boolean>) => {
    const next = PRODUCTS.filter((product) => selected[product.key]).map((product) => {
      const quantity = quantities[product.key]
      const total = Math.round(product.cycleHours * 3600 * quantity / product.capacity)
      return { ...product, quantity, elapsed: 0, remaining: total, startElapsed: 0, startRemaining: total }
    })
    setLines(next)
    setModalOpen(false)
    setRunning(true)
    toast.success("Nueva producción iniciada", { description: `${next.length} ${next.length === 1 ? "línea comenzó" : "líneas comenzaron"} en paralelo.` })
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Máquinas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control y capacidad de producción</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus /> Nueva producción</Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Máquinas activas" value="1" hint="Máquina Láctea M-01" icon={Settings2} />
        <MetricCard label="Produciendo ahora" value={`${producing} productos`} hint="Líneas simultáneas" icon={Activity} />
        <MetricCard label="Capacidad del turno" value="240 unidades" hint="Turno de 8 horas" icon={Gauge} />
        <MetricCard label="Próximo producto listo" value={<span className="text-xl">{nextLine?.name ?? "Todo listo"}</span>} hint={nextLine ? formatDuration(nextLine.remaining) : "Producción terminada"} icon={Timer} />
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><Factory className="h-5 w-5" /></div>
            <div><h2 className="text-lg font-extrabold">Máquina Láctea M-01</h2><p className="text-sm text-muted-foreground">Producción simultánea de productos lácteos</p></div>
          </div>
          <span className={cn("inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold", producing ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}><span className={cn("h-2 w-2 rounded-full", producing ? "bg-emerald-500" : "bg-slate-400")} />{producing ? running ? "Produciendo" : "Producción pausada" : "Ciclo terminado"}</span>
        </div>
        <div className="grid grid-cols-3 divide-x bg-slate-50/70 px-6 py-3 text-xs">
          <div><span className="text-muted-foreground">Turno actual:</span> <strong>8 horas</strong></div>
          <div className="pl-5"><span className="text-muted-foreground">Inicio:</span> <strong>8:00 AM</strong></div>
          <div className="pl-5"><span className="text-muted-foreground">Fin estimado:</span> <strong>4:00 PM</strong></div>
        </div>
        <div className="grid divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">{lines.map((line) => <ProductionLine key={line.key} line={line} />)}</div>
        <div className="flex flex-wrap items-center justify-center gap-2 border-t bg-slate-50/60 p-4">
          <Button onClick={() => setRunning(true)} disabled={running || producing === 0}><Play /> Iniciar producción</Button>
          <Button variant="outline" onClick={() => setRunning(false)} disabled={!running}><Pause /> Pausar</Button>
          <Button variant="ghost" onClick={reset}><RefreshCcw /> Reiniciar</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Clock3 className="h-5 w-5" /></div><div><h2 className="font-bold">Capacidad en turno de 8 horas</h2><p className="text-sm text-muted-foreground">Producción potencial por línea</p></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {PRODUCTS.map((product) => {
            const cycles = Math.floor(8 / product.cycleHours)
            const units = product.capacity * cycles
            return <div key={product.key}><div className="flex items-end justify-between"><div><p className="font-bold">{product.name}</p><p className="text-xs text-muted-foreground">{cycles} {cycles === 1 ? "ciclo completo" : "ciclos"}</p></div><p className="text-lg font-extrabold">{units} <span className="text-xs font-medium text-muted-foreground">unidades</span></p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, cycles * 25)}%` }} /></div></div>
          })}
        </div>
        <div className="mt-6 flex items-center justify-between rounded-xl bg-primary-soft p-4 text-sm"><span className="font-semibold text-primary">Capacidad potencial total</span><strong className="text-lg text-primary">240 unidades</strong></div>
      </Card>

      <NewProductionModal open={modalOpen} onClose={() => setModalOpen(false)} onStart={startNewCycle} />
    </>
  )
}
