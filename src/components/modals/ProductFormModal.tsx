import { useEffect, useState, type ChangeEvent } from "react"
import { Package } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, ModalShell } from "./ModalShell"
import { useInventory } from "@/store/inventory"

const empty = { name: "", sku: "", unit: "", cost: "", price: "" }

export function ProductFormModal() {
  const { modal, closeModal, upsertProduct, getProduct } = useInventory()
  const open = modal?.type === "product"
  const editing = open && modal.productId ? getProduct(modal.productId) : undefined
  const [f, setF] = useState(empty)

  useEffect(() => {
    if (!open) return
    setF(editing ? { name: editing.name, sku: editing.sku, unit: editing.unit, cost: String(editing.cost), price: String(editing.price) } : empty)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof empty) => (e: ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const valid = f.name.trim() && f.sku.trim() && Number(f.price) > 0

  const submit = () => {
    if (!valid) return
    upsertProduct({ name: f.name.trim(), sku: f.sku.trim().toUpperCase(), unit: f.unit.trim() || "Unidad", cost: Number(f.cost) || 0, price: Number(f.price) }, editing?.id)
    toast.success(editing ? "Producto actualizado" : "Producto agregado", { description: f.name })
    closeModal()
  }

  return (
    <ModalShell
      open={open} onClose={closeModal} icon={Package}
      title={editing ? "Editar producto" : "Agregar producto"}
      description={editing ? editing.sku : "Crea un nuevo SKU en el catálogo"}
      footer={<>
        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
        <Button onClick={submit} disabled={!valid}>{editing ? "Guardar cambios" : "Agregar producto"}</Button>
      </>}
    >
      <Field label="Nombre"><Input placeholder="Ej. Kumis" value={f.name} onChange={set("name")} autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU"><Input placeholder="KUM-001" value={f.sku} onChange={set("sku")} className="font-mono uppercase" /></Field>
        <Field label="Unidad"><Input placeholder="Botella 1 L" value={f.unit} onChange={set("unit")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Costo (COP)"><Input type="number" placeholder="0" value={f.cost} onChange={set("cost")} /></Field>
        <Field label="Precio (COP)"><Input type="number" placeholder="0" value={f.price} onChange={set("price")} /></Field>
      </div>
    </ModalShell>
  )
}
