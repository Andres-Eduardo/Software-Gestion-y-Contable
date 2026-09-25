import { useEffect, useState, type FormEvent } from "react";
import { useAuthStore } from "../store/auth.store";
import { useMermasStore } from "../store/mermas.store";
import { apiFetch } from "../api/client";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";

interface ProductoApi {
  id: string;
  nombre: string;
  tipo: string;
}

export default function MermasPage() {
  const token = useAuthStore((s) => s.token)!;
  const usuario = useAuthStore((s) => s.usuario);
  const { motivos, cargarMotivos, registrarMerma } = useMermasStore();

  const [productos, setProductos] = useState<ProductoApi[]>([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivoMermaId, setMotivoMermaId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarMotivos(token);
    apiFetch<ProductoApi[]>("/productos", { token }).then(setProductos);
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!usuario?.sedeId) return;
    setError(null);
    setExito(false);
    setEnviando(true);
    try {
      await registrarMerma(token, {
        productoId,
        bodegaOrigenId: usuario.sedeId,
        cantidad: Number(cantidad),
        motivoMermaId,
        observaciones: observaciones || undefined,
      });
      setExito(true);
      setProductoId("");
      setCantidad("");
      setMotivoMermaId("");
      setObservaciones("");
    } catch (err: any) {
      setError(err.message ?? "No se pudo registrar la merma");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-4 md:p-8 max-w-lg">
        <h1 className="font-display text-2xl md:text-3xl text-espresso mb-1">
          Registrar merma
        </h1>
        <p className="text-ink/60 text-sm mb-6">
          Producto dañado, vencido, roto, o que se perdió de otra forma.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-ink/10 rounded-xl p-5 space-y-4"
        >
          <div>
            <label className="block text-sm text-ink/70 mb-1">Producto</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
              className="w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-caramel"
            >
              <option value="">Selecciona un producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
              className="w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-caramel tabular-nums"
            />
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1">Motivo</label>
            <select
              value={motivoMermaId}
              onChange={(e) => setMotivoMermaId(e.target.value)}
              required
              className="w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-caramel"
            >
              <option value="">Selecciona un motivo...</option>
              {motivos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-caramel"
            />
          </div>

          {error && <p className="text-brick text-sm">{error}</p>}
          {exito && (
            <p className="text-olive text-sm">
              Merma registrada correctamente.
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-caramel text-espresso font-semibold rounded-lg py-2.5 text-sm hover:brightness-95 transition disabled:opacity-50"
          >
            {enviando ? "Registrando..." : "Registrar merma"}
          </button>
        </form>
      </div>
    </div>
  );
}
