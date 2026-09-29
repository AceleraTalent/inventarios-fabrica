# Inventario Fábrica → Tienda

Prototipo frontend de un sistema de inventario para una empresa de alimentos. Muestra el flujo **Fábrica → En tránsito → Tienda → Vendido**.

Solo frontend: datos mock y estado local (sin backend, API ni login). Al recargar, los datos vuelven a su estado inicial.

## Stack

React · TypeScript · Vite · Tailwind CSS · componentes estilo shadcn/ui (Radix) · Lucide · Recharts · Sonner

## Correr localmente

```bash
npm install
npm run dev
```

## Estructura

- `src/pages/`: Dashboard, Fábrica, Tienda, En tránsito, Ventas, Productos, Reportes, Configuración
- `src/components/dashboard/`: etapas del flujo, tabla, gráfica semanal, alertas
- `src/components/modals/`: registrar producción, enviar a tienda, registrar venta, producto
- `src/components/drawers/`: detalle de etapa y detalle de producto
- `src/store/inventory.tsx`: estado global (Context) y acciones
- `src/data/mock.ts`: productos, envíos y ventas de ejemplo

## Créditos de imágenes

- Fotos de productos: [Unsplash](https://unsplash.com) (licencia Unsplash).
- Arepas: "Arepitas" por Steven Depolo, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), vía [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Arepitas_Food_Macro.jpg).
