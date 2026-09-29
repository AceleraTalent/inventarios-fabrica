import { ChevronRight } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProductCell, SkuTag, StatusBadge } from "@/components/shared"
import { formatMoney, formatNumber } from "@/lib/utils"
import { useInventory } from "@/store/inventory"
import type { Product } from "@/data/types"

export function InventoryTable({ list }: { list: Product[] }) {
  const { openProduct, stockStatus } = useInventory()
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Inventory by Product</CardTitle>
          <CardDescription className="mt-0.5">Haz clic en un producto para ver su detalle</CardDescription>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{list.length} SKUs</span>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Fábrica</TableHead>
            <TableHead className="text-right">En tránsito</TableHead>
            <TableHead className="text-right">Tienda</TableHead>
            <TableHead className="text-right">Vendido</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p) => (
            <TableRow key={p.id} className="group cursor-pointer" onClick={() => openProduct(p.id)}>
              <TableCell><ProductCell product={p} /></TableCell>
              <TableCell><SkuTag sku={p.sku} /></TableCell>
              <TableCell className="tabular text-right font-medium">{formatNumber(p.factory)}</TableCell>
              <TableCell className="tabular text-right font-medium">{formatNumber(p.transit)}</TableCell>
              <TableCell className="tabular text-right font-semibold">{formatNumber(p.store)}</TableCell>
              <TableCell className="tabular text-right font-medium">{formatNumber(p.sold)}</TableCell>
              <TableCell className="tabular text-right font-medium">{formatMoney(p.price)}</TableCell>
              <TableCell><StatusBadge status={stockStatus(p)} /></TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
