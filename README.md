# Inventario Fábrica → Tienda

Prototipo frontend de un sistema de inventario para una empresa de alimentos. Muestra el flujo **Fábrica → En tránsito → Tienda → Vendido**.

Los datos viven en **Neon Postgres**: ventas, envíos, recepciones y producción se guardan y todos los que tengan la app abierta ven los cambios (se sincroniza cada 4 s). No tiene login.

## Stack

React · TypeScript · Vite · Tailwind CSS · componentes estilo shadcn/ui (Radix) · Lucide · Recharts · Sonner
Backend: una Vercel Function (`api/inventory.ts`) con `pg` sobre Neon.

## Correr localmente

```bash
npm install
npm run dev
```

Con `npm run dev` no hay API, así que la app entra en **Modo local** con datos de ejemplo. Los datos reales solo se ven en el despliegue de Vercel, que es donde está la conexión a Neon (`DATABASE_URL`).

## Base de datos

- La API crea las tablas y carga los datos iniciales la primera vez que se llama.
- Cada movimiento corre en una transacción, y la base rechaza cualquier stock negativo (restricciones `CHECK`).
- Tablas: `products`, `shipments`, `shipment_items`, `sales`, `history`, `settings`.

### Reiniciar a los datos iniciales

Requiere el token `RESET_TOKEN` (está en Vercel y en `.env.local`, nunca en git):

```bash
curl -X POST https://inventarios-fabrica-ten.vercel.app/api/inventory \
  -H "content-type: application/json" -H "x-reset-token: $RESET_TOKEN" \
  -d '{"action":"reset"}'
```

## Estructura

- `src/pages/`: Dashboard, Fábrica, Tienda, En tránsito, Ventas, Productos, Reportes, Configuración
- `src/components/dashboard/`: etapas del flujo, tabla, gráfica semanal, alertas
- `src/components/modals/`: registrar producción, enviar a tienda, registrar venta, producto
- `src/components/drawers/`: detalle de etapa y detalle de producto
- `api/inventory.ts`: API (lectura, movimientos, esquema y datos iniciales)
- `src/lib/api.ts`: cliente de la API
- `src/store/inventory.tsx`: estado global sincronizado con Neon (Context) y acciones
- `src/data/mock.ts`: productos, envíos y ventas de ejemplo (modo local)

## Créditos de imágenes

- Fotos de productos: [Unsplash](https://unsplash.com) (licencia Unsplash).
- Arepas: "Arepitas" por Steven Depolo, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), vía [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Arepitas_Food_Macro.jpg).
