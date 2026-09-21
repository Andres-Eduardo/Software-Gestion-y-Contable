import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuthStore } from "../store/auth.store";
import { useSedesStore } from "../store/sedes.store";
import { useInventarioStore } from "../store/inventario.store";
import { apiFetch } from "../api/client";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";

interface ProductoApi {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
}

const ROLES_GESTION = ["ADMIN", "GERENTE", "DOMICILIARIO"];

export default function InventarioPage() {
  const token = useAuthStore((s) => s.token)!;
  const usuario = useAuthStore((s) => s.usuario);
  const esAdminOGerente =
    usuario?.rol === "ADMIN" || usuario?.rol === "GERENTE";

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
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [accionando, setAccionando] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(`Error al confirmar: ${err.message}`);
    } finally {
      setAccionando(null);
    }
  }

  const bodegaCentral = useMemo(
    () => sedes.find((s) => s.tipo === "BODEGA_CENTRAL"),
    [sedes],
  );

  useEffect(() => {
    cargarSedes(token);
    cargarMovimientos(token);
    apiFetch<ProductoApi[]>("/productos", { token }).then(setProductos);
  }, [token]);

  useEffect(() => {
    if (!sedeVista || productos.length === 0) return;
    cargarStock(
      token,
      sedeVista,
      productos.map((p) => p.id),
    );
  }, [sedeVista, productos, token]);

  async function handleSolicitar(e: FormEvent) {
    e.preventDefault();
    if (!bodegaCentral || !sedeVista) return;
    setError(null);

    setEnviando(true);
    try {
      await solicitarTraslado(token, {
        productoId,
        bodegaOrigenId: bodegaCentral.id,
        bodegaDestinoId: sedeVista,
        cantidad: Number(cantidad),
      });
      setProductoId("");
      setCantidad("");
    } catch (err: any) {
      setError(err.message ?? "No se pudo solicitar");
    } finally {
      setEnviando(false);
    }
  }

  function puedeDespachar(m: (typeof movimientos)[number]) {
    if (m.estado !== "SOLICITADO") return false;
    return esAdminOGerente || usuario?.rol === "DOMICILIARIO";
  }

  function puedeConfirmar(m: (typeof movimientos)[number]) {
    if (m.estado !== "DESPACHADO") return false;
    return esAdminOGerente || m.bodegaDestinoId === usuario?.sedeId;
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-6 md:p-8 max-w-4xl">
        <h1 className="font-display text-3xl text-espresso mb-1">Inventario</h1>
        <p className="text-ink/60 text-sm mb-6">
          Stock por sede, solicitudes de reabastecimiento y traslados.
        </p>

        {esAdminOGerente && (
          <div className="mb-6">
            <label className="block text-sm text-ink/70 mb-1">Ver sede</label>
            <select
              value={sedeVista}
              onChange={(e) => setSedeVista(e.target.value)}
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
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

        {sedeVista && (
          <div className="bg-white border border-ink/10 rounded-xl p-5 mb-6">
            <h2 className="font-display text-xl text-espresso mb-3">
              Stock actual
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productos.map((p) => (
                <div key={p.id} className="border border-ink/10 rounded-lg p-3">
                  <p className="text-sm text-ink">{p.nombre}</p>
                  <p className="text-caramel font-semibold tabular-nums">
                    {stockPorProducto[p.id] ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sedeVista && bodegaCentral && (
          <form
            onSubmit={handleSolicitar}
            className="bg-white border border-ink/10 rounded-xl p-5 mb-6 space-y-3"
          >
            <h2 className="font-display text-xl text-espresso">
              Solicitar reabastecimiento
            </h2>
            <div className="flex gap-3">
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                required
                className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
              >
                <option value="">Producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Cantidad"
                required
                className="w-28 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel tabular-nums"
              />
              <button
                type="submit"
                disabled={enviando}
                className="bg-caramel text-espresso font-semibold rounded-lg px-4 text-sm hover:brightness-95 transition disabled:opacity-50"
              >
                Solicitar
              </button>
            </div>
            {error && <p className="text-brick text-sm">{error}</p>}
          </form>
        )}

        {error && <p className="text-brick text-sm mb-4">{error}</p>}

        <div className="bg-white border border-ink/10 rounded-xl overflow-hidden">
          <h2 className="font-display text-xl text-espresso p-5 pb-0">
            Movimientos
          </h2>
          <table className="w-full text-sm mt-3">
            <thead className="bg-paper text-ink/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Origen → Destino</th>
                <th className="px-4 py-2 font-medium">Cantidad</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-t border-ink/5">
                  <td className="px-4 py-2.5">{m.producto.nombre}</td>
                  <td className="px-4 py-2.5 text-ink/60">
                    {m.bodegaOrigen?.nombre ?? "—"} →{" "}
                    {m.bodegaDestino?.nombre ?? "—"}
                  </td>
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
      </div>
    </div>
  );
}
