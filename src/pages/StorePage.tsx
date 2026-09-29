import { AlertTriangle, Boxes, ShoppingBag, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MetricCard, PageHeader, ProductCell, SkuTag, StatusBadge } from "@/components/shared"
import { formatMoney, formatMoneyShort, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

export function StorePage() {
  const { products, stockStatus, openModal, openProduct, lowStockThreshold } = useInventory()
  const units = products.reduce((a, p) => a + p.store, 0)
  const value = products.reduce((a, p) => a + p.store * p.price, 0)
  const low = products.filter((p) => stockStatus(p) !== "normal").length

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
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell><ProductCell product={p} onClick={() => openProduct(p.id)} /></TableCell>
                <TableCell><SkuTag sku={p.sku} /></TableCell>
                <TableCell className="tabular text-right font-semibold">{formatNumber(p.store)}</TableCell>
                <TableCell className="tabular text-right">{formatMoney(p.price)}</TableCell>
                <TableCell className="tabular text-right font-medium">{formatMoney(p.store * p.price)}</TableCell>
                <TableCell><StatusBadge status={stockStatus(p)} /></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="soft" disabled={p.store <= 0} onClick={() => openModal({ type: "sale", productId: p.id })}>
                    <ShoppingBag /> Registrar venta
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
