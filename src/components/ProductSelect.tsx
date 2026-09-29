import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductThumb } from "@/components/shared"
import { useInventory } from "@/store/inventory"
import { Boxes } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (v: string) => void
  includeAll?: boolean
  placeholder?: string
  className?: string
  /** texto secundario por producto (ej. stock disponible) */
  meta?: (id: string) => string
}

export function ProductSelect({ value, onChange, includeAll, placeholder = "Selecciona un producto", className, meta }: Props) {
  const { products } = useInventory()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <>
            <SelectItem value="all">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Boxes className="h-3.5 w-3.5" />
              </span>
              Todos los productos
            </SelectItem>
            <SelectSeparator />
          </>
        )}
        {products.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <ProductThumb product={p} size="sm" className="!h-6 !w-6 !rounded-md" />
            <span>{p.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{meta ? meta(p.id) : p.sku}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
