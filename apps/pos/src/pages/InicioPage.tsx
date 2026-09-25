import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuthStore } from "../store/auth.store";
import { useSedesStore } from "../store/sedes.store";
import { useInventarioStore } from "../store/inventario.store";
import { apiFetch } from "../api/client";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";
import { IconLocation, IconPlus } from "../components/icons";

interface ProductoApi {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
}

const UMBRAL_STOCK_BAJO = 10;

export default function InventarioPage() {
  const token = useAuthStore((s) => s.token)!;
  const usuario = useAuthStore((s) => s.usuario);
  const esAdminOGerente =
    usuario?.rol === "ADMIN" || usuario?.rol === "GERENTE";
  const esDomiciliario = usuario?.rol === "DOMICILIARIO";
  const puedeGestionarSede = esAdminOGerente || esDomiciliario;
  const puedeCrearTraslado = esAdminOGerente || esDomiciliario;

  const { sedes, cargarSedes } = useSedesStore();
  const {
    movimientos,
    stockPorProducto,
    cargarMovimientos,
    cargarStock,

    solicitarTraslado,
    despachar,
    confirmar,
  } = useInventarioStore();

  const [productos, setProductos] = useState<ProductoApi[]>([]);
  const [sedeVista, setSedeVista] = useState(usuario?.sedeId ?? "");
  const [mostrarSelectorSede, setMostrarSelectorSede] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [accionando, setAccionando] = useState<string | null>(null);

  const bodegaCentral = useMemo(
    () => sedes.find((s) => s.tipo === "BODEGA_CENTRAL"),
    [sedes],
  );
  const nombreSedeVista =
    sedes.find((s) => s.id === sedeVista)?.nombre ?? "Selecciona sede";

  useEffect(() => {
    cargarSedes(token);
    cargarMovimientos(token);
    apiFetch<ProductoApi[]>("/productos", { token }).then(setProductos);
  }, [token]);

  function refrescarStock() {
    if (!sedeVista || productos.length === 0) return;
    cargarStock(
      token,
      sedeVista,
      productos.map((p) => p.id),
    );
  }

  useEffect(() => {
    refrescarStock();
  }, [sedeVista, productos, token]);

  async function handleSolicitar(e: FormEvent) {
    e.preventDefault();
    if (!bodegaCentral || !sedeVista) return;
    setError(null);
    setEnviando(true);
    try {
      const creado = await solicitarTraslado(token, {
        productoId,
        bodegaOrigenId: bodegaCentral.id,
        bodegaDestinoId: sedeVista,
        cantidad: Number(cantidad),
      });

      // El domiciliario ya lleva el producto físicamente al registrarlo,
      // así que se despacha solo en el mismo paso — un solo toque para él.
      if (esDomiciliario) {
        await despachar(token, creado.id);
      }

      setProductoId("");
      setCantidad("");
      setMostrarForm(false);
    } catch (err: any) {
      setError(err.message ?? "No se pudo registrar el traslado");
    } finally {
      setEnviando(false);
    }
  }

  async function handleDespachar(id: string) {
    setAccionando(id);
    setError(null);
    try {
      await despachar(token, id);
    } catch (err: any) {
      setError(`Error al despachar: ${err.message}`);
    } finally {
      setAccionando(null);
    }
  }

  async function handleConfirmar(id: string) {
    setAccionando(id);
    setError(null);
    try {
      await confirmar(token, id);
      refrescarStock();
    } catch (err: any) {
      setError(`Error al confirmar: ${err.message}`);
    } finally {
      setAccionando(null);
    }
  }

  function puedeDespachar(m: (typeof movimientos)[number]) {
    if (m.estado !== "SOLICITADO") return false;
    return esAdminOGerente || esDomiciliario;
  }

  function puedeConfirmar(m: (typeof movimientos)[number]) {
    if (m.estado !== "DESPACHADO") return false;
    // El domiciliario NUNCA puede confirmar su propia entrega, sin importar
    // qué sede tenga asignada — la confirmación es exclusiva de quien recibe.
    if (esDomiciliario) return false;
    return esAdminOGerente || m.bodegaDestinoId === usuario?.sedeId;
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-4 md:p-8 max-w-4xl">
        <div className="flex items-start md:items-center justify-between mb-1">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-espresso">
              Inventario
            </h1>
            {puedeGestionarSede && sedeVista && (
              <p className="md:hidden text-ink/50 text-xs mt-0.5">
                {nombreSedeVista}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {puedeGestionarSede && (
              <button
                onClick={() => setMostrarSelectorSede((v) => !v)}
                aria-label="Cambiar sede"
                className="w-9 h-9 md:w-auto md:px-3 rounded-lg md:rounded-full bg-white border border-ink/15 text-ink flex items-center justify-center gap-1.5 text-xs font-medium"
              >
                <IconLocation className="text-caramel" />
                <span className="hidden md:inline">{nombreSedeVista}</span>
              </button>
            )}

            {puedeCrearTraslado && sedeVista && (
              <button
                onClick={() => setMostrarForm((v) => !v)}
                aria-label="Nuevo traslado"
                className="w-9 h-9 md:w-auto md:px-4 rounded-lg bg-caramel text-espresso flex items-center justify-center gap-1.5 text-sm font-semibold hover:brightness-95 transition"
              >
                <IconPlus className="md:hidden" />
                <span className="hidden md:inline">+ Nuevo traslado</span>
              </button>
            )}
          </div>
        </div>

        {puedeGestionarSede && mostrarSelectorSede && (
          <div className="bg-white border border-ink/10 rounded-xl p-4 mt-3 mb-2">
            <label className="block text-sm text-ink/70 mb-1">Ver sede</label>
            <select
              value={sedeVista}
              onChange={(e) => {
                setSedeVista(e.target.value);
                setMostrarSelectorSede(false);
              }}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
            >
              <option value="">Selecciona una sede</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {puedeCrearTraslado && sedeVista && mostrarForm && (
          <form
            onSubmit={handleSolicitar}
            className="bg-white border border-ink/10 rounded-xl p-4 mt-3 mb-2 space-y-3"
          >
            <p className="text-sm font-medium text-ink">Nuevo traslado</p>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
            >
              <option value="">Producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Cantidad"
                required
                className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel tabular-nums"
              />
              <button
                type="submit"
                disabled={enviando}
                className="bg-caramel text-espresso font-semibold rounded-lg px-4 text-sm hover:brightness-95 transition disabled:opacity-50"
              >
                {enviando ? "..." : "Enviar"}
              </button>
            </div>
          </form>
        )}

        {error && <p className="text-brick text-sm mt-3">{error}</p>}

        {sedeVista && (
          <div className="mt-5">
            <h2 className="font-display text-lg md:text-xl text-espresso mb-3">
              Stock actual
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productos.map((p) => {
                const stock = stockPorProducto[p.id];
                const stockBajo =
                  stock !== undefined && stock <= UMBRAL_STOCK_BAJO;
                return (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-lg p-3 ${
                      stockBajo ? "border-brick/40" : "border-ink/10"
                    }`}
                  >
                    <p className="text-sm text-ink">{p.nombre}</p>
                    <p
                      className={`font-semibold tabular-nums ${
                        stockBajo ? "text-brick" : "text-caramel"
                      }`}
                    >
                      {stock ?? "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="font-display text-lg md:text-xl text-espresso mb-3">
            Movimientos
          </h2>

          {/* Escritorio: tabla */}
          <div className="hidden md:block bg-white border border-ink/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper text-ink/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Producto</th>
                  {puedeGestionarSede && (
                    <th className="px-4 py-2 font-medium">Origen → Destino</th>
                  )}
                  <th className="px-4 py-2 font-medium">Cantidad</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-t border-ink/5">
                    <td className="px-4 py-2.5">{m.producto.nombre}</td>
                    {puedeGestionarSede && (
                      <td className="px-4 py-2.5 text-ink/60">
                        {m.bodegaOrigen?.nombre ?? "—"} →{" "}
                        {m.bodegaDestino?.nombre ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-2.5 tabular-nums">{m.cantidad}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-ink/60 text-xs">{m.estado}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {puedeDespachar(m) && (
                        <button
                          onClick={() => handleDespachar(m.id)}
                          disabled={accionando === m.id}
                          className="text-caramel text-xs font-medium hover:underline disabled:opacity-50"
                        >
                          {accionando === m.id ? "..." : "Despachar"}
                        </button>
                      )}
                      {puedeConfirmar(m) && (
                        <button
                          onClick={() => handleConfirmar(m.id)}
                          disabled={accionando === m.id}
                          className="text-olive text-xs font-medium hover:underline disabled:opacity-50"
                        >
                          {accionando === m.id ? "..." : "Confirmar recepción"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-2.5">
            {movimientos.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-ink/10 rounded-xl p-3"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-sm font-medium text-ink">
                    {m.producto.nombre}
                  </span>
                  <span className="text-[10px] font-semibold text-ink/60 bg-paper px-2 py-0.5 rounded-full whitespace-nowrap">
                    {m.estado}
                  </span>
                </div>
                <p className="text-xs text-ink/50 mb-2">
                  {puedeGestionarSede
                    ? `${m.bodegaOrigen?.nombre ?? "—"} → ${m.bodegaDestino?.nombre ?? "—"} · ${m.cantidad} un`
                    : `${m.cantidad} un`}
                </p>
                {(puedeDespachar(m) || puedeConfirmar(m)) && (
                  <div className="flex gap-3">
                    {puedeDespachar(m) && (
                      <button
                        onClick={() => handleDespachar(m.id)}
                        disabled={accionando === m.id}
                        className="text-caramel text-xs font-semibold disabled:opacity-50"
                      >
                        {accionando === m.id ? "..." : "Despachar"}
                      </button>
                    )}
                    {puedeConfirmar(m) && (
                      <button
                        onClick={() => handleConfirmar(m.id)}
                        disabled={accionando === m.id}
                        className="text-olive text-xs font-semibold disabled:opacity-50"
                      >
                        {accionando === m.id ? "..." : "Confirmar recepción"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
