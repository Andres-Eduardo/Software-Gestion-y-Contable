import { useState, type FormEvent } from "react";
import { useTurnoStore } from "../store/turno.store";

export default function AperturaTurno() {
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const abrirTurno = useTurnoStore((s) => s.abrirTurno);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await abrirTurno(Number(monto));
    } catch (err: any) {
      setError(err.message ?? "No se pudo abrir el turno");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-ink/10 rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-3xl text-espresso mb-1">Abrir caja</h1>
        <p className="text-ink/60 mb-6">
          Declara el efectivo con el que inicias el turno.
        </p>

        <label className="block text-sm text-ink/70 mb-1">
          Efectivo inicial
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

        {error && <p className="text-brick text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-caramel hover:brightness-95 disabled:opacity-50 text-espresso font-semibold rounded-lg py-3 transition"
        >
          {cargando ? "Abriendo..." : "Abrir caja"}
        </button>
      </form>
    </div>
  );
}
