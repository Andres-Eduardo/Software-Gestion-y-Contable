import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useTurnoStore } from "../store/turno.store";
import { apiFetch } from "../api/client";
import { cerrarSesion } from "../store/session";

interface ResultadoCierre {
  efectivoInicial: string;
  efectivoDeclaradoCierre: string;
  efectivoTeoricoCierre: string;
  descuadre: string;
}

export default function CerrarTurnoPage() {
  const token = useAuthStore((s) => s.token)!;
  const turno = useTurnoStore((s) => s.turno);
  const navigate = useNavigate();

  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoCierre | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!turno) return;
    setCargando(true);
    setError(null);
    try {
      const res = await apiFetch<ResultadoCierre>(
        `/turnos/${turno.id}/cerrar`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            efectivoDeclaradoCierre: Number(monto),
            observaciones: observaciones || undefined,
          }),
        },
      );
      setResultado(res);
    } catch (err: any) {
      setError(err.message ?? "No se pudo cerrar el turno");
    } finally {
      setCargando(false);
    }
  }

  if (!turno) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-ink/60 mb-3">No tienes un turno abierto.</p>
          <Link to="/venta" className="text-caramel font-medium">
            Volver a Venta
          </Link>
        </div>
      </div>
    );
  }

  if (resultado) {
    const descuadre = Number(resultado.descuadre);
    const cuadrado = descuadre === 0;
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="bg-white border border-ink/10 rounded-2xl p-8 w-full max-w-sm">
          <h1 className="font-display text-3xl text-espresso mb-5 text-center">
            Turno cerrado
          </h1>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-ink/60">
              <span>Efectivo inicial</span>
              <span className="tabular-nums">
                ${Number(resultado.efectivoInicial).toLocaleString("es-CO")}
              </span>
            </div>
            <div className="flex justify-between text-sm text-ink/60">
              <span>Declarado por ti</span>
              <span className="tabular-nums">
                $
                {Number(resultado.efectivoDeclaradoCierre).toLocaleString(
                  "es-CO",
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm text-ink/60">
              <span>Teórico (sistema)</span>
              <span className="tabular-nums">
                $
                {Number(resultado.efectivoTeoricoCierre).toLocaleString(
                  "es-CO",
                )}
              </span>
            </div>
            <div
              className={`flex justify-between text-lg font-semibold pt-3 mt-1 border-t border-ink/10 ${
                cuadrado ? "text-olive" : "text-brick"
              }`}
            >
              <span>
                {cuadrado
                  ? "Cuadrado"
                  : descuadre > 0
                    ? "Sobrante"
                    : "Faltante"}
              </span>
              <span className="tabular-nums">
                ${Math.abs(descuadre).toLocaleString("es-CO")}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              cerrarSesion();
              navigate("/login");
            }}
            className="w-full bg-caramel text-espresso font-semibold rounded-lg py-3 hover:brightness-95 transition"
          >
            Finalizar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-ink/10 rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-3xl text-espresso mb-1">
          Cerrar caja
        </h1>
        <p className="text-ink/60 text-sm mb-6">
          Cuenta el efectivo físico y declara el total. El sistema te mostrará
          el balance después.
        </p>

        <label className="block text-sm text-ink/70 mb-1">
          Efectivo contado
        </label>
        <input
          type="number"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
          placeholder="0"
          className="w-full rounded-lg border border-ink/15 px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-caramel text-lg tabular-nums"
        />

        <label className="block text-sm text-ink/70 mb-1">
          Observaciones (opcional)
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-ink/15 px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-caramel text-sm"
        />

        {error && <p className="text-brick text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={cargando || !monto}
          className="w-full bg-caramel hover:brightness-95 disabled:opacity-50 text-espresso font-semibold rounded-lg py-3 transition"
        >
          {cargando ? "Cerrando..." : "Cerrar caja"}
        </button>
      </form>
    </div>
  );
}
