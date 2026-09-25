import { useState, type FormEvent } from "react";
import { useTurnoStore } from "../../store/turno.store";

interface Props {
  onListo: () => void;
  onCancelar: () => void;
}

export default function AvisoAbrirTurno({ onListo, onCancelar }: Props) {
  const abrirTurno = useTurnoStore((s) => s.abrirTurno);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await abrirTurno(Number(monto));
      onListo();
    } catch (err: any) {
      setError(err.message ?? "No se pudo abrir el turno");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cancelar"
        onClick={onCancelar}
        className="absolute inset-0 bg-espresso/50"
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl p-6 w-full max-w-sm"
      >
        <h2 className="font-display text-xl text-espresso mb-1">
          Antes de vender...
        </h2>
        <p className="text-ink/60 text-sm mb-4">
          Declara el efectivo con el que inicias tu turno.
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
          autoFocus
          className="w-full rounded-lg border border-ink/15 px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-caramel text-lg tabular-nums"
        />

        {error && <p className="text-brick text-sm mb-4">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 text-ink/50 text-sm py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="flex-1 bg-caramel hover:brightness-95 disabled:opacity-50 text-espresso font-semibold rounded-lg py-2.5 text-sm transition"
          >
            {cargando ? "Abriendo..." : "Abrir caja"}
          </button>
        </div>
      </form>
    </div>
  );
}
