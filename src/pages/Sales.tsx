import { Receipt, ShoppingBag, TrendingUp, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, MetricCard, PageHeader, ProductThumb } from "@/components/shared"
import { formatMoney, formatMoneyShort, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

export function SalesPage() {
  const { products, sales, getProduct, openModal } = useInventory()
  const units = products.reduce((a, p) => a + p.sold, 0)
  const revenue = products.reduce((a, p) => a + p.sold * p.price, 0)
  const top = [...products].sort((a, b) => b.sold - a.sold)[0]

  return (
    <>
      <PageHeader title="Ventas" subtitle="Registro de ventas de la tienda">
        <Button onClick={() => openModal({ type: "sale" })}><ShoppingBag /> Registrar venta</Button>
      </PageHeader>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Unidades vendidas" value={formatNumber(units)} hint="Esta semana" icon={Receipt} />
        <MetricCard label="Ingresos" value={formatMoneyShort(revenue)} hint={formatMoney(revenue)} icon={Wallet} />
        <MetricCard label="Más vendido" value={<span className="text-2xl">{top?.name ?? "—"}</span>} hint={top ? `${top.sold} unidades` : undefined} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Ventas recientes</CardTitle>
            <CardDescription className="mt-0.5">{sales.length} transacciones</CardDescription>
          </div>
        </CardHeader>
        {sales.length === 0 ? (
          <EmptyState icon={Receipt} title="Aún no hay ventas" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venta</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => {
                const p = getProduct(s.productId)
                return (
                  <TableRow key={s.id} className="animate-in fade-in">
                    <TableCell className="font-mono text-xs font-semibold">{s.id}</TableCell>
                    <TableCell>
                      {p && <div className="flex items-center gap-2.5"><ProductThumb product={p} size="sm" /><span className="font-semibold">{p.name}</span></div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.date} · {s.time}</TableCell>
                    <TableCell className="tabular text-right font-medium">{s.qty}</TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">{formatMoney(s.unitPrice)}</TableCell>
                    <TableCell className="tabular text-right font-bold">{formatMoney(s.qty * s.unitPrice)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
