import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { useSedesStore } from "../store/sedes.store";
import { useProduccionStore, type Lote } from "../store/produccion.store";
import { apiFetch } from "../api/client";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";

interface ProductoApi {
  id: string;
  nombre: string;
}

export default function ProduccionPage() {
  const token = useAuthStore((s) => s.token)!;
  const usuario = useAuthStore((s) => s.usuario);
  const esAdminOGerente =
    usuario?.rol === "ADMIN" || usuario?.rol === "GERENTE";

  const { sedes, cargarSedes } = useSedesStore();
  const { recetas, lotes, cargarRecetas, cargarLotes, abrirLote, cerrarLote } =
    useProduccionStore();

  const [productos, setProductos] = useState<ProductoApi[]>([]);
  const [sedeActiva, setSedeActiva] = useState(usuario?.sedeId ?? "");
  const [loteEnCierre, setLoteEnCierre] = useState<string | null>(null);
  const [cantidadesReales, setCantidadesReales] = useState<
    Record<string, string>
  >({});
  const [cantidadProducida, setCantidadProducida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const nombreProducto = useMemo(() => {
    const map: Record<string, string> = {};

    productos.forEach((p) => (map[p.id] = p.nombre));
    return map;
  }, [productos]);

  useEffect(() => {
    cargarSedes(token);
    cargarRecetas(token);
    cargarLotes(token);
    apiFetch<ProductoApi[]>("/productos", { token }).then(setProductos);
  }, [token]);

  const lotesEnProceso = lotes.filter((l) => l.estado === "EN_PROCESO");
  const lotesFinalizados = lotes.filter((l) => l.estado === "FINALIZADO");

  async function handleAbrirLote(recetaId: string) {
    if (!sedeActiva) {
      setError("Selecciona una sede primero");
      return;
    }
    setError(null);
    await abrirLote(token, recetaId, sedeActiva);
  }

  function iniciarCierre(lote: Lote) {
    setLoteEnCierre(lote.id);
    const iniciales: Record<string, string> = {};
    lote.insumos.forEach((i) => (iniciales[i.insumoId] = i.cantidadTeorica));
    setCantidadesReales(iniciales);
    setCantidadProducida("");
  }

  async function handleCerrarLote(lote: Lote) {
    setError(null);
    setEnviando(true);
    try {
      await cerrarLote(token, lote.id, {
        cantidadProducidaReal: Number(cantidadProducida),
        insumos: lote.insumos.map((i) => ({
          insumoId: i.insumoId,
          cantidadReal: Number(cantidadesReales[i.insumoId] ?? 0),
        })),
      });
      setLoteEnCierre(null);
    } catch (err: any) {
      setError(err.message ?? "No se pudo cerrar el lote");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-6 md:p-8 max-w-4xl">
        <h1 className="font-display text-3xl text-espresso mb-1">Producción</h1>
        <p className="text-ink/60 text-sm mb-6">
          Recetas, lotes en proceso y cierre con variación.
        </p>

        {esAdminOGerente && (
          <div className="mb-6">
            <label className="block text-sm text-ink/70 mb-1">
              Sede de producción
            </label>
            <select
              value={sedeActiva}
              onChange={(e) => setSedeActiva(e.target.value)}
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

        {error && <p className="text-brick text-sm mb-4">{error}</p>}

        <div className="bg-white border border-ink/10 rounded-xl p-5 mb-6">
          <h2 className="font-display text-xl text-espresso mb-3">
            Recetas disponibles
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recetas
              .filter((r) => r.activa)
              .map((r) => (
                <div key={r.id} className="border border-ink/10 rounded-lg p-3">
                  <p className="text-sm text-ink font-medium">{r.nombre}</p>
                  <p className="text-ink/50 text-xs mb-2">
                    Rinde {r.rendimiento}
                  </p>
                  <button
                    onClick={() => handleAbrirLote(r.id)}
                    className="text-caramel text-xs font-semibold hover:underline"
                  >
                    Abrir lote
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-xl p-5 mb-6">
          <h2 className="font-display text-xl text-espresso mb-3">
            Lotes en proceso
          </h2>
          {lotesEnProceso.length === 0 && (
            <p className="text-ink/50 text-sm">No hay lotes abiertos.</p>
          )}
          <div className="space-y-3">
            {lotesEnProceso.map((lote) => (
              <div
                key={lote.id}
                className="border border-ink/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {lote.receta.nombre}
                    </p>
                    <p className="text-ink/50 text-xs">
                      {lote.usuario.nombreCompleto}
                    </p>
                  </div>
                  {loteEnCierre !== lote.id && (
                    <button
                      onClick={() => iniciarCierre(lote)}
                      className="bg-caramel text-espresso font-semibold rounded-lg px-3 py-1.5 text-xs hover:brightness-95 transition"
                    >
                      Cerrar lote
                    </button>
                  )}
                </div>

                {loteEnCierre === lote.id && (
                  <div className="mt-4 pt-4 border-t border-ink/10 space-y-3">
                    {lote.insumos.map((i) => (
                      <div
                        key={i.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-sm text-ink/70">
                          {nombreProducto[i.insumoId] ?? i.insumoId}

                          <span className="text-ink/40 text-xs ml-2">
                            (teórico: {i.cantidadTeorica})
                          </span>
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={cantidadesReales[i.insumoId] ?? ""}
                          onChange={(e) =>
                            setCantidadesReales((prev) => ({
                              ...prev,
                              [i.insumoId]: e.target.value,
                            }))
                          }
                          className="w-28 rounded-lg border border-ink/15 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-caramel tabular-nums"
                        />
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-ink/5">
                      <span className="text-sm font-medium text-ink">
                        Cantidad producida real
                      </span>
                      <input
                        type="number"
                        value={cantidadProducida}
                        onChange={(e) => setCantidadProducida(e.target.value)}
                        required
                        className="w-28 rounded-lg border border-ink/15 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-caramel tabular-nums"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setLoteEnCierre(null)}
                        className="text-ink/50 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleCerrarLote(lote)}
                        disabled={enviando || !cantidadProducida}
                        className="bg-olive text-cream font-semibold rounded-lg px-3 py-1.5 text-xs hover:brightness-95 transition disabled:opacity-50"
                      >
                        {enviando ? "Guardando..." : "Confirmar cierre"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-xl overflow-hidden">
          <h2 className="font-display text-xl text-espresso p-5 pb-0">
            Historial
          </h2>
          <table className="w-full text-sm mt-3">
            <thead className="bg-paper text-ink/60 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Receta</th>
                <th className="px-4 py-2 font-medium">Producido</th>
                <th className="px-4 py-2 font-medium">Panadero</th>
              </tr>
            </thead>
            <tbody>
              {lotesFinalizados.map((l) => (
                <tr key={l.id} className="border-t border-ink/5">
                  <td className="px-4 py-2.5">{l.receta.nombre}</td>

                  <td className="px-4 py-2.5 tabular-nums">
                    {l.cantidadProducidaReal}
                  </td>
                  <td className="px-4 py-2.5 text-ink/60">
                    {l.usuario.nombreCompleto}
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
