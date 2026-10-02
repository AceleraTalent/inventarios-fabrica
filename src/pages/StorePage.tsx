import { useState } from "react"
import { AlertTriangle, Boxes, Minus, Plus, ShoppingBag, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MetricCard, PageHeader, ProductCell, SkuTag, StatusBadge } from "@/components/shared"
import { cn, formatMoney, formatMoneyShort, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

export function StorePage() {
  const { products, stockStatus, openProduct, lowStockThreshold, registerSale } = useInventory()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const units = products.reduce((a, p) => a + p.store, 0)
  const value = products.reduce((a, p) => a + p.store * p.price, 0)
  const low = products.filter((p) => stockStatus(p) !== "normal").length

  const setQuantity = (productId: string, value: number) => {
    setQuantities((current) => ({ ...current, [productId]: Math.max(0, Math.floor(value || 0)) }))
  }

  const sell = (productId: string) => {
    const product = products.find((item) => item.id === productId)
    const quantity = quantities[productId] ?? 0
    if (!product || quantity <= 0) return
    if (quantity > product.store) {
      toast.error(`Solo hay ${product.store} unidades disponibles`, { duration: 2500 })
      return
    }
    if (!registerSale(product.id, quantity)) return
    toast.success(`Venta registrada: ${quantity} ${product.name} · ${formatMoney(quantity * product.price)}`, { duration: 2500 })
    setQuantity(product.id, 0)
  }

  return (
    <>
      <PageHeader title="Inventario tienda" subtitle="Unidades disponibles para la venta" />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total unidades" value={formatNumber(units)} hint={`${products.length} productos`} icon={Boxes} />
        <MetricCard label="Valor estimado" value={formatMoneyShort(value)} hint={`${formatMoney(value)} a precio de venta`} icon={Wallet} />
        <MetricCard label="Stock bajo" value={low} hint={`≤ ${lowStockThreshold} unidades o agotado`} icon={AlertTriangle} tone="warning" />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Productos en tienda</CardTitle>
            <CardDescription className="mt-0.5">Registra ventas directamente desde cada fila</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio venta</TableHead>
              <TableHead className="text-right">Valor inventario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Vender</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const quantity = quantities[p.id] ?? 0
              const overStock = quantity > p.store
              const disabled = p.store <= 0
              return (
              <TableRow key={p.id}>
                <TableCell><ProductCell product={p} onClick={() => openProduct(p.id)} /></TableCell>
                <TableCell><SkuTag sku={p.sku} /></TableCell>
                <TableCell className="tabular text-right font-semibold">{formatNumber(p.store)}</TableCell>
                <TableCell className="tabular text-right">{formatMoney(p.price)}</TableCell>
                <TableCell className="tabular text-right font-medium">{formatMoney(p.store * p.price)}</TableCell>
                <TableCell><StatusBadge status={stockStatus(p)} /></TableCell>
                <TableCell>
                  <div className="flex min-w-[132px] flex-col items-center gap-1.5">
                    <div className={cn(
                      "inline-flex h-9 items-center rounded-lg border bg-white shadow-soft focus-within:ring-4",
                      overStock ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100" : "border-input focus-within:border-primary focus-within:ring-primary/10",
                      disabled && "opacity-45"
                    )}>
                      <button
                        type="button"
                        aria-label={`Disminuir venta de ${p.name}`}
                        disabled={disabled || quantity <= 0}
                        onClick={() => setQuantity(p.id, quantity - 1)}
                        className="flex h-full w-8 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        aria-label={`Cantidad a vender de ${p.name}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={quantity}
                        disabled={disabled}
                        onFocus={(event) => event.target.select()}
                        onKeyDown={(event) => {
                          if (["-", ".", ",", "e", "E"].includes(event.key)) event.preventDefault()
                          if (event.key === "Enter") { event.preventDefault(); sell(p.id) }
                        }}
                        onChange={(event) => setQuantity(p.id, Number(event.target.value))}
                        className="tabular h-full w-12 border-x border-input bg-transparent text-center text-sm font-bold outline-none disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        aria-label={`Aumentar venta de ${p.name}`}
                        disabled={disabled}
                        onClick={() => setQuantity(p.id, quantity + 1)}
                        className="flex h-full w-8 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className={cn("tabular text-[11px] font-semibold", overStock ? "text-rose-600" : quantity > 0 ? "text-primary" : "text-muted-foreground")}>
                      {overStock ? `Máximo ${p.store}` : formatMoney(quantity * p.price)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="soft" disabled={disabled || quantity <= 0} onClick={() => sell(p.id)}>
                    <ShoppingBag /> Registrar venta
                  </Button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
