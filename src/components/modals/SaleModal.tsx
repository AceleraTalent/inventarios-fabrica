import { useEffect, useRef, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ProductSelect } from "@/components/ProductSelect"
import { ProductThumb, SkuTag } from "@/components/shared"
import { Field, ModalShell } from "./ModalShell"
import { cn, formatMoney } from "@/lib/utils"
import { useInventory } from "@/store/inventory"

export function SaleModal() {
  const { modal, closeModal, registerSale, getProduct } = useInventory()
  const open = modal?.type === "sale"
  const presetId = open ? modal.productId : undefined
  const [productId, setProductId] = useState("")
  const [raw, setRaw] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setProductId(presetId ?? ""); setRaw("") }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const p = getProduct(productId)
  const available = p?.store ?? 0
  const qty = raw === "" ? 0 : Number(raw)

  // Solo enteros positivos que no superen el stock de tienda
  const error = !p || raw === "" ? null
    : qty <= 0 ? "Ingresa una cantidad mayor a 0."
    : qty > available ? `No puedes registrar ${qty} unidades. Solo tienes ${available} disponibles en tienda.`
    : null
  const valid = !!p && raw !== "" && qty > 0 && qty <= available

  const submit = () => {
    if (!valid || !p) return
    if (!registerSale(p.id, qty)) return
    toast.success(`Venta registrada: ${qty} ${qty === 1 ? "unidad" : "unidades"} de ${p.name}`)
    closeModal()
  }

  return (
    <ModalShell
      open={open} onClose={closeModal} icon={ShoppingBag}
      title="Registrar venta" description="Descuenta unidades del inventario de tienda"
      initialFocus={presetId ? inputRef : undefined}
      footer={<>
        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
        <Button onClick={submit} disabled={!valid}>Confirmar venta</Button>
      </>}
    >
      <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-4">
        {presetId && p ? (
          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
            <ProductThumb product={p} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.name}</p>
              <SkuTag sku={p.sku} />
            </div>
          </div>
        ) : (
          <Field label="Producto">
            <ProductSelect
              value={productId}
              onChange={(v) => { setProductId(v); setRaw(""); setTimeout(() => inputRef.current?.focus(), 50) }}
              meta={(id) => `${getProduct(id)?.store ?? 0} en tienda`}
            />
          </Field>
        )}

        {p && (
          <p className="text-sm text-muted-foreground">
            Stock disponible en tienda: <b className="tabular text-foreground">{available} unidades</b>
          </p>
        )}

        <Field label="Cantidad vendida">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={raw}
            disabled={!p}
            // Solo dígitos: sin negativos, decimales ni letras
            onKeyDown={(e) => { if (["-", "+", ".", ",", "e", "E"].includes(e.key)) e.preventDefault() }}
            onChange={(e) => setRaw(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
            className={cn(
              "tabular h-14 w-full rounded-xl border bg-white px-4 text-center text-2xl font-extrabold shadow-soft outline-none transition placeholder:text-muted-foreground/40 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-input focus:border-primary focus:ring-primary/10"
            )}
          />
        </Field>
        {error && <p className="-mt-2 text-sm font-medium text-rose-600">{error}</p>}

        {p && (
          <div className="space-y-1.5 rounded-xl bg-muted/60 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Precio unitario</span>
              <span className="tabular font-semibold">{formatMoney(p.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total venta</span>
              <span className="tabular text-lg font-extrabold">{formatMoney(qty * p.price)}</span>
            </div>
          </div>
        )}
      </form>
    </ModalShell>
  )
}
