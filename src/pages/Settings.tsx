import { useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared"
import { Field } from "@/components/modals/ModalShell"
import { useInventory } from "@/store/inventory"

export function SettingsPage() {
  const { companyName, lowStockThreshold, updateSettings } = useInventory()
  const [name, setName] = useState(companyName)
  const [threshold, setThreshold] = useState(String(lowStockThreshold))
  const [currency, setCurrency] = useState("COP")

  const save = () => {
    updateSettings({ companyName: name.trim() || companyName, lowStockThreshold: Math.max(0, Number(threshold) || 0) })
    toast.success("Configuración guardada")
  }

  return (
    <>
      <PageHeader title="Configuración" subtitle="Preferencias generales del sistema" />
      <Card className="max-w-2xl">
        <CardHeader>
          <div>
            <CardTitle>General</CardTitle>
            <CardDescription className="mt-0.5">Estos valores se aplican a todo el inventario</CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-5 px-6 pb-6">
          <Field label="Nombre de la empresa"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Umbral de stock bajo" hint="Unidades en tienda para marcar “Low stock”">
              <Input type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </Field>
            <Field label="Moneda">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP · Peso colombiano</SelectItem>
                  <SelectItem value="USD">USD · Dólar</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <div className="flex justify-end border-t p-5">
          <Button onClick={save}><Save /> Guardar cambios</Button>
        </div>
      </Card>
    </>
  )
}
