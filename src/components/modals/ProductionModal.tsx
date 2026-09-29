import { useEffect, useState } from "react"
import { Factory } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductSelect } from "@/components/ProductSelect"
import { Field, ModalShell } from "./ModalShell"
import { useInventory } from "@/store/inventory"

export function ProductionModal() {
  const { modal, closeModal, addProduction, getProduct } = useInventory()
  const open = modal?.type === "production"
  const [productId, setProductId] = useState("")
  const [qty, setQty] = useState("")

  useEffect(() => {
    if (open) { setProductId(modal.productId ?? ""); setQty("") }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const p = getProduct(productId)
  const n = Number(qty)
  const valid = !!p && n > 0

  const submit = () => {
    if (!valid) return
    addProduction(productId, n)
    toast.success("Producción registrada", { description: `+${n} ${p!.name} en fábrica` })
    closeModal()
  }

  return (
    <ModalShell
      open={open} onClose={closeModal} icon={Factory}
      title="Registrar producción" description="Suma unidades al inventario de fábrica"
      footer={<>
        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
        <Button onClick={submit} disabled={!valid}>Agregar producción</Button>
      </>}
    >
      <Field label="Producto">
        <ProductSelect value={productId} onChange={setProductId} />
      </Field>
      <Field label="Cantidad" hint={p ? <>Stock actual en fábrica: <b className="text-foreground">{p.factory}</b> → <b className="text-primary">{p.factory + (n > 0 ? n : 0)}</b></> : undefined}>
        <Input type="number" min={1} placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      </Field>
    </ModalShell>
  )
}
