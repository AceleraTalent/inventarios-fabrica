import { Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader, ProductCell, SkuTag, StatusBadge } from "@/components/shared"
import { formatMoney, marginPct } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

export function ProductsPage() {
  const { products, openModal, openProduct, stockStatus } = useInventory()
  return (
    <>
      <PageHeader title="Productos" subtitle={`${products.length} SKUs en el catálogo`}>
        <Button onClick={() => openModal({ type: "product" })}><Plus /> Agregar producto</Button>
      </PageHeader>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const m = marginPct(p.cost, p.price)
              return (
                <TableRow key={p.id}>
                  <TableCell><ProductCell product={p} onClick={() => openProduct(p.id)} /></TableCell>
                  <TableCell><SkuTag sku={p.sku} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{p.unit}</TableCell>
                  <TableCell className="tabular text-right">{formatMoney(p.cost)}</TableCell>
                  <TableCell className="tabular text-right font-semibold">{formatMoney(p.price)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-muted md:block">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, m)}%` }} />
                      </div>
                      <span className="tabular w-10 text-sm font-semibold">{m.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={stockStatus(p)} /></TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => openModal({ type: "product", productId: p.id })}>
                          <Pencil />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar producto</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
