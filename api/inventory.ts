/**
 * API de inventario (Vercel Function + Neon Postgres).
 *
 *   GET  /api/inventory  → estado completo
 *   POST /api/inventory  → { action, ... } ejecuta un movimiento y devuelve el estado completo
 *
 * La primera vez crea las tablas y carga los datos iniciales.
 * Todos los movimientos corren en transacción y las restricciones CHECK
 * impiden que cualquier stock quede negativo.
 */
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 })

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

type Client = pg.PoolClient

async function tx<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query("BEGIN")
    const out = await fn(c)
    await c.query("COMMIT")
    return out
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {})
    throw e
  } finally {
    c.release()
  }
}

/* ───────────────────────── esquema + datos iniciales ───────────────────────── */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  unit text NOT NULL DEFAULT 'Unidad',
  cost integer NOT NULL DEFAULT 0 CHECK (cost >= 0),
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  factory integer NOT NULL DEFAULT 0 CHECK (factory >= 0),
  transit integer NOT NULL DEFAULT 0 CHECK (transit >= 0),
  store integer NOT NULL DEFAULT 0 CHECK (store >= 0),
  sold integer NOT NULL DEFAULT 0 CHECK (sold >= 0),
  prev_week integer NOT NULL DEFAULT 0,
  week_production integer NOT NULL DEFAULT 0,
  image text,
  position serial
);
CREATE TABLE IF NOT EXISTS shipments (
  id text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('in_transit', 'received')),
  created_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz
);
CREATE TABLE IF NOT EXISTS shipment_items (
  shipment_id text NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty integer NOT NULL CHECK (qty > 0),
  PRIMARY KEY (shipment_id, product_id)
);
CREATE TABLE IF NOT EXISTS sales (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS history (
  id bigserial PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL,
  detail text NOT NULL,
  tone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL);
CREATE SEQUENCE IF NOT EXISTS product_seq START 11;
`

const SEED = {
  products: [
    ["p1", "Huevos", "HUE-001", "Cubeta x30", 8000, 12000, 80, 30, 42, 28, 70, 80, "/products/huevos.jpg"],
    ["p2", "Yogur", "YOG-001", "Vaso 1 L", 4500, 7200, 50, 20, 35, 31, 45, 50, "/products/yogur.jpg"],
    ["p3", "Arándanos", "ARA-001", "Caja 125 g", 6000, 9800, 35, 15, 8, 22, 40, 35, "/products/arandanos.jpg"],
    ["p4", "Arepas", "ARE-001", "Paquete x5", 2800, 4500, 70, 25, 50, 38, 65, 70, "/products/arepas.jpg"],
    ["p5", "Leche", "LEC-001", "Bolsa 1 L", 3200, 4800, 60, 0, 0, 45, 60, 60, "/products/leche.jpg"],
    ["p6", "Queso", "QUE-001", "Bloque 500 g", 11000, 16500, 40, 10, 18, 12, 35, 40, "/products/queso.jpg"],
    ["p7", "Granola", "GRA-001", "Bolsa 500 g", 7500, 12900, 30, 10, 6, 14, 30, 30, "/products/granola.jpg"],
    ["p8", "Pan", "PAN-001", "Pan tajado", 3500, 5900, 45, 15, 30, 26, 50, 45, "/products/pan.jpg"],
    ["p9", "Mantequilla", "MAN-001", "Barra 250 g", 5200, 8500, 25, 5, 22, 9, 25, 25, "/products/mantequilla.jpg"],
    ["p10", "Jugo", "JUG-001", "Botella 1 L", 4200, 6900, 15, 10, 20, 15, 20, 15, "/products/jugo.jpg"],
  ],
  history: [
    ["p1", "Producción", "+40 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p1", "Transferencia", "-20 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p1", "En tránsito", "+20", "transit", "2026-09-24T010:00:00-05:00"],
    ["p1", "Recepción", "+20 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p1", "Venta", "-10 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p2", "Producción", "+25 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p2", "Transferencia", "-13 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p2", "En tránsito", "+13", "transit", "2026-09-24T010:00:00-05:00"],
    ["p2", "Recepción", "+13 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p2", "Venta", "-7 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p3", "Producción", "+20 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p3", "Transferencia", "-10 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p3", "En tránsito", "+10", "transit", "2026-09-24T010:00:00-05:00"],
    ["p3", "Recepción", "+10 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p3", "Venta", "-5 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p4", "Producción", "+35 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p4", "Transferencia", "-18 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p4", "En tránsito", "+18", "transit", "2026-09-24T010:00:00-05:00"],
    ["p4", "Recepción", "+18 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p4", "Venta", "-9 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p5", "Producción", "+30 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p5", "Transferencia", "-15 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p5", "En tránsito", "+15", "transit", "2026-09-24T010:00:00-05:00"],
    ["p5", "Recepción", "+15 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p5", "Venta", "-8 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p6", "Producción", "+20 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p6", "Transferencia", "-10 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p6", "En tránsito", "+10", "transit", "2026-09-24T010:00:00-05:00"],
    ["p6", "Recepción", "+10 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p6", "Venta", "-5 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p7", "Producción", "+15 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p7", "Transferencia", "-8 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p7", "En tránsito", "+8", "transit", "2026-09-24T010:00:00-05:00"],
    ["p7", "Recepción", "+8 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p7", "Venta", "-4 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p8", "Producción", "+25 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p8", "Transferencia", "-13 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p8", "En tránsito", "+13", "transit", "2026-09-24T010:00:00-05:00"],
    ["p8", "Recepción", "+13 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p8", "Venta", "-7 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p9", "Producción", "+15 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p9", "Transferencia", "-8 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p9", "En tránsito", "+8", "transit", "2026-09-24T010:00:00-05:00"],
    ["p9", "Recepción", "+8 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p9", "Venta", "-4 tienda", "sold", "2026-09-26T012:00:00-05:00"],
    ["p10", "Producción", "+10 fábrica", "factory", "2026-09-23T08:00:00-05:00"],
    ["p10", "Transferencia", "-5 fábrica", "factory", "2026-09-24T09:00:00-05:00"],
    ["p10", "En tránsito", "+5", "transit", "2026-09-24T010:00:00-05:00"],
    ["p10", "Recepción", "+5 tienda", "store", "2026-09-25T011:00:00-05:00"],
    ["p10", "Venta", "-3 tienda", "sold", "2026-09-26T012:00:00-05:00"],
  ],
  shipments: [
    ["ENV-004", "in_transit", "2026-09-28T07:30:00-05:00", null],
    ["ENV-003", "in_transit", "2026-09-27T07:30:00-05:00", null],
    ["ENV-002", "received", "2026-09-25T07:30:00-05:00", "2026-09-26T10:00:00-05:00"],
    ["ENV-001", "received", "2026-09-22T07:30:00-05:00", "2026-09-23T10:00:00-05:00"],
  ],
  shipmentItems: [
    ["ENV-004", "p1", 30],
    ["ENV-004", "p2", 20],
    ["ENV-004", "p3", 15],
    ["ENV-004", "p4", 15],
    ["ENV-004", "p6", 10],
    ["ENV-003", "p4", 10],
    ["ENV-003", "p7", 10],
    ["ENV-003", "p8", 15],
    ["ENV-003", "p9", 5],
    ["ENV-003", "p10", 10],
    ["ENV-002", "p1", 25],
    ["ENV-002", "p2", 20],
    ["ENV-002", "p4", 30],
    ["ENV-002", "p5", 25],
    ["ENV-002", "p8", 20],
    ["ENV-002", "p10", 15],
    ["ENV-001", "p3", 20],
    ["ENV-001", "p5", 20],
    ["ENV-001", "p6", 18],
    ["ENV-001", "p7", 12],
    ["ENV-001", "p9", 15],
  ],
  sales: [
    ["V-1042", "p5", 6, 4800, "2026-09-28T11:24:00-05:00"],
    ["V-1041", "p1", 4, 12000, "2026-09-28T10:02:00-05:00"],
    ["V-1040", "p4", 8, 4500, "2026-09-28T09:15:00-05:00"],
    ["V-1039", "p2", 5, 7200, "2026-09-27T18:40:00-05:00"],
    ["V-1038", "p3", 3, 9800, "2026-09-27T16:12:00-05:00"],
    ["V-1037", "p8", 7, 5900, "2026-09-27T12:55:00-05:00"],
    ["V-1036", "p6", 2, 16500, "2026-09-26T17:31:00-05:00"],
    ["V-1035", "p10", 4, 6900, "2026-09-26T09:48:00-05:00"],
  ],
}

async function seed(c: Client) {
  for (const r of SEED.products)
    await c.query(
      `INSERT INTO products (id, name, sku, unit, cost, price, factory, transit, store, sold, prev_week, week_production, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, r)
  for (const r of SEED.history)
    await c.query("INSERT INTO history (product_id, type, detail, tone, created_at) VALUES ($1,$2,$3,$4,$5)", r)
  for (const r of SEED.shipments)
    await c.query("INSERT INTO shipments (id, status, created_at, received_at) VALUES ($1,$2,$3,$4)", r)
  for (const r of SEED.shipmentItems)
    await c.query("INSERT INTO shipment_items (shipment_id, product_id, qty) VALUES ($1,$2,$3)", r)
  for (const r of SEED.sales)
    await c.query("INSERT INTO sales (id, product_id, qty, unit_price, created_at) VALUES ($1,$2,$3,$4,$5)", r)
  await c.query(`INSERT INTO settings (key, value) VALUES ('companyName', 'Andina Foods'), ('lowStockThreshold', '10')
                 ON CONFLICT (key) DO NOTHING`)
}

let ready: Promise<void> | null = null

function ensureDb() {
  ready ??= tx(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(4242)") // evita que dos instancias migren a la vez
    await c.query(SCHEMA)
    const { rows } = await c.query("SELECT count(*)::int AS n FROM products")
    if (rows[0].n === 0) await seed(c)
  }).catch((e) => {
    ready = null
    throw e
  })
  return ready
}

/* ───────────────────────── lectura ───────────────────────── */

async function readState(c: pg.PoolClient | pg.Pool) {
  const [products, shipments, sales, history, settings] = await Promise.all([
    c.query(`SELECT id, name, sku, unit, cost, price, factory, transit, store, sold,
                    prev_week AS "prevWeek", week_production AS "weekProduction", image
             FROM products ORDER BY position`),
    c.query(`SELECT s.id, s.status, s.created_at AS "createdAt", s.received_at AS "receivedAt",
                    COALESCE(json_agg(json_build_object('productId', i.product_id, 'qty', i.qty)) FILTER (WHERE i.product_id IS NOT NULL), '[]') AS items
             FROM shipments s LEFT JOIN shipment_items i ON i.shipment_id = s.id
             GROUP BY s.id ORDER BY s.created_at DESC, s.id DESC`),
    c.query(`SELECT id, product_id AS "productId", qty, unit_price AS "unitPrice", created_at AS "createdAt"
             FROM sales ORDER BY created_at DESC, id DESC LIMIT 200`),
    c.query(`SELECT id::text, product_id AS "productId", type, detail, tone, created_at AS "createdAt"
             FROM history ORDER BY created_at DESC, id DESC LIMIT 1000`),
    c.query(`SELECT key, value FROM settings`),
  ])
  const s = Object.fromEntries(settings.rows.map((r) => [r.key, r.value]))
  return {
    products: products.rows,
    shipments: shipments.rows,
    sales: sales.rows,
    history: history.rows,
    settings: { companyName: s.companyName ?? "Andina Foods", lowStockThreshold: Number(s.lowStockThreshold ?? 10) },
  }
}

/* ───────────────────────── validación ───────────────────────── */

const posInt = (v: unknown, field = "cantidad") => {
  if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) throw new HttpError(400, `La ${field} debe ser un entero mayor a 0`)
  return v
}
const nonNegInt = (v: unknown, field: string) => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) throw new HttpError(400, `${field} debe ser un entero ≥ 0`)
  return v
}
const str = (v: unknown, field: string) => {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, `${field} es obligatorio`)
  return v.trim()
}

async function lockProduct(c: Client, id: unknown) {
  const { rows } = await c.query("SELECT * FROM products WHERE id = $1 FOR UPDATE", [str(id, "Producto")])
  if (!rows[0]) throw new HttpError(404, "Producto no encontrado")
  return rows[0]
}

const log = (c: Client, productId: string, type: string, detail: string, tone: string) =>
  c.query("INSERT INTO history (product_id, type, detail, tone) VALUES ($1,$2,$3,$4)", [productId, type, detail, tone])

/** Siguiente id consecutivo tipo ENV-005 / V-1043 (tabla bloqueada durante la transacción). */
async function nextId(c: Client, table: "shipments" | "sales", prefix: string, pad: number, min: number) {
  await c.query(`LOCK TABLE ${table} IN SHARE ROW EXCLUSIVE MODE`)
  const { rows } = await c.query(`SELECT COALESCE(MAX(split_part(id, '-', 2)::int), $1) + 1 AS n FROM ${table}`, [min])
  return `${prefix}-${String(rows[0].n).padStart(pad, "0")}`
}

/* ───────────────────────── movimientos ───────────────────────── */

type Body = Record<string, any>

const ACTIONS: Record<string, (c: Client, b: Body) => Promise<void>> = {
  // Producción: suma a fábrica
  async production(c, b) {
    const p = await lockProduct(c, b.productId)
    const qty = posInt(b.qty)
    await c.query("UPDATE products SET factory = factory + $2, week_production = week_production + $2 WHERE id = $1", [p.id, qty])
    await log(c, p.id, "Producción", `+${qty} fábrica`, "factory")
  },

  // Carga semanal: ajusta fábrica por la diferencia con lo ya cargado
  async weeklyProduction(c, b) {
    const values = b.values as Record<string, unknown>
    if (!values || typeof values !== "object") throw new HttpError(400, "Valores inválidos")
    for (const [id, v] of Object.entries(values)) {
      const p = await lockProduct(c, id)
      const next = nonNegInt(v, "La producción")
      const delta = next - p.week_production
      if (delta === 0) continue
      await c.query("UPDATE products SET week_production = $2, factory = GREATEST(0, factory + $3) WHERE id = $1", [id, next, delta])
      await log(c, id, "Producción", `${delta > 0 ? "+" : ""}${delta} fábrica`, "factory")
    }
  },

  // Envío: fábrica → tránsito
  async ship(c, b) {
    const items = (Array.isArray(b.items) ? b.items : []) as Body[]
    if (!items.length) throw new HttpError(400, "El envío no tiene productos")
    const id = await nextId(c, "shipments", "ENV", 3, 0)
    await c.query("INSERT INTO shipments (id, status) VALUES ($1, 'in_transit')", [id])
    for (const it of items) {
      const p = await lockProduct(c, it.productId)
      const qty = posInt(it.qty)
      if (qty > p.factory) throw new HttpError(409, `${p.name}: solo hay ${p.factory} unidades en fábrica`)
      await c.query("UPDATE products SET factory = factory - $2, transit = transit + $2 WHERE id = $1", [p.id, qty])
      await c.query("INSERT INTO shipment_items (shipment_id, product_id, qty) VALUES ($1,$2,$3)", [id, p.id, qty])
      await log(c, p.id, "Transferencia", `-${qty} fábrica`, "factory")
      await log(c, p.id, "En tránsito", `+${qty}`, "transit")
    }
  },

  // Recepción: tránsito → tienda
  async receive(c, b) {
    const { rows } = await c.query("SELECT status FROM shipments WHERE id = $1 FOR UPDATE", [str(b.id, "Envío")])
    if (!rows[0]) throw new HttpError(404, "Envío no encontrado")
    if (rows[0].status === "received") throw new HttpError(409, "Este envío ya fue recibido")
    await c.query("UPDATE shipments SET status = 'received', received_at = now() WHERE id = $1", [b.id])
    const items = await c.query("SELECT product_id, qty FROM shipment_items WHERE shipment_id = $1", [b.id])
    for (const it of items.rows) {
      await c.query("UPDATE products SET transit = GREATEST(0, transit - $2), store = store + $2 WHERE id = $1", [it.product_id, it.qty])
      await log(c, it.product_id, "Recepción", `+${it.qty} tienda`, "store")
    }
  },

  // Venta: tienda → vendido (fábrica y tránsito no cambian)
  async sale(c, b) {
    const p = await lockProduct(c, b.productId)
    const qty = posInt(b.qty)
    if (qty > p.store) throw new HttpError(409, `No puedes registrar ${qty} unidades. Solo tienes ${p.store} disponibles en tienda.`)
    await c.query("UPDATE products SET store = store - $2, sold = sold + $2 WHERE id = $1", [p.id, qty])
    const id = await nextId(c, "sales", "V", 0, 1000)
    await c.query("INSERT INTO sales (id, product_id, qty, unit_price) VALUES ($1,$2,$3,$4)", [id, p.id, qty, p.price])
    await log(c, p.id, "Venta", `-${qty} tienda`, "sold")
  },

  // Crear / editar producto
  async product(c, b) {
    const data = [str(b.name, "Nombre"), str(b.sku, "SKU").toUpperCase(), (typeof b.unit === "string" && b.unit.trim()) || "Unidad",
      nonNegInt(b.cost ?? 0, "El costo"), nonNegInt(b.price, "El precio")]
    const dup = await c.query("SELECT 1 FROM products WHERE sku = $1 AND id <> COALESCE($2, '')", [data[1], b.id ?? null])
    if (dup.rowCount) throw new HttpError(409, `Ya existe un producto con SKU ${data[1]}`)
    if (b.id) {
      await lockProduct(c, b.id)
      await c.query("UPDATE products SET name=$2, sku=$3, unit=$4, cost=$5, price=$6 WHERE id=$1", [b.id, ...data])
    } else {
      await c.query("INSERT INTO products (id, name, sku, unit, cost, price) VALUES ('p' || nextval('product_seq'), $1,$2,$3,$4,$5)", data)
    }
  },

  async settings(c, b) {
    await c.query(
      `INSERT INTO settings (key, value) VALUES ('companyName', $1), ('lowStockThreshold', $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [str(b.companyName, "Nombre"), String(nonNegInt(b.lowStockThreshold, "El umbral"))]
    )
  },
}

/* ───────────────────────── handlers ───────────────────────── */

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } })

function fail(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status)
  // Violación de CHECK (stock negativo) por concurrencia
  if ((e as { code?: string })?.code === "23514") return json({ error: "Stock insuficiente para este movimiento" }, 409)
  console.error(e)
  return json({ error: "Error de servidor" }, 500)
}

export async function GET() {
  try {
    await ensureDb()
    return json(await readState(pool))
  } catch (e) {
    return fail(e)
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb()
    const body = (await request.json().catch(() => null)) as Body | null
    // Reinicio a los datos iniciales: solo con el token secreto (RESET_TOKEN en Vercel)
    if (body?.action === "reset") {
      const token = process.env.RESET_TOKEN
      if (!token || request.headers.get("x-reset-token") !== token) throw new HttpError(403, "No autorizado")
      return json(await tx(async (c) => {
        await c.query("TRUNCATE history, sales, shipment_items, shipments, products, settings RESTART IDENTITY CASCADE")
        await c.query("ALTER SEQUENCE product_seq RESTART WITH 11")
        await seed(c)
        return readState(c)
      }))
    }
    const run = body && ACTIONS[body.action]
    if (!run) throw new HttpError(400, "Acción no válida")
    const state = await tx(async (c) => {
      await run(c, body)
      return readState(c)
    })
    return json(state)
  } catch (e) {
    return fail(e)
  }
}
