import { ProductionModal } from "./ProductionModal"
import { SaleModal } from "./SaleModal"
import { ShipModal } from "./ShipModal"
import { ProductFormModal } from "./ProductFormModal"

export function GlobalModals() {
  return (
    <>
      <ProductionModal />
      <ShipModal />
      <SaleModal />
      <ProductFormModal />
    </>
  )
}
