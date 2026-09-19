import { useState } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useTercerosStore, type Tercero } from "../../store/terceros.store";
import type { ClienteSeleccionado } from "../../store/tickets.store";

interface Props {
  cliente: ClienteSeleccionado | null;
  onAsignar: (cliente: ClienteSeleccionado | null) => void;
}

export default function ClienteCredito({ cliente, onAsignar }: Props) {
  const token = useAuthStore((s) => s.token)!;
  const terceros = useTercerosStore((s) => s.terceros);
  const cargarTerceros = useTercerosStore((s) => s.cargarTerceros);
  const crearTercero = useTercerosStore((s) => s.crearTercero);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoDocumento, setNuevoDocumento] = useState("");
  const [nuevoTipoPersona, setNuevoTipoPersona] = useState<
    "NATURAL" | "JURIDICA"
  >("NATURAL");
  const [creando, setCreando] = useState(false);

  function abrirBuscador() {
    cargarTerceros(token);
  }

  const resultados =
    busqueda.length > 0
      ? terceros.filter(
          (t) =>
            t.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
            t.numeroDocumento.includes(busqueda),
        )
      : [];

  function formatoCliente(t: Tercero) {
    return t.tipoDocumento === "NIT"
      ? `NIT ${t.numeroDocumento}-${t.dv}`
      : `${t.tipoDocumento} ${t.numeroDocumento}`;
  }

  async function handleCrear() {
    setCreando(true);
    try {
      const nuevo = await crearTercero(token, {
        tipoPersona: nuevoTipoPersona,
        tipoDocumento: nuevoTipoPersona === "JURIDICA" ? "NIT" : "CC",
        numeroDocumento: nuevoDocumento,
        nombreCompleto: nuevoNombre,
      });
      onAsignar({
        id: nuevo.id,
        nombreCompleto: nuevo.nombreCompleto,
        tipoDocumento: nuevo.tipoDocumento,
        numeroDocumento: nuevo.numeroDocumento,
        dv: nuevo.dv,
      });
      setMostrarFormulario(false);
      setNuevoNombre("");
      setNuevoDocumento("");
    } finally {
      setCreando(false);
    }
  }

  if (cliente) {
    return (
      <div className="mb-3">
        <p className="text-cream/60 text-xs mb-1.5">
          Cliente (requerido para crédito)
        </p>
        <div className="bg-cream/10 border border-cream/20 rounded-lg px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{cliente.nombreCompleto}</p>
            <p className="text-cream/50 text-xs tabular-nums">
              {cliente.tipoDocumento === "NIT"
                ? `NIT ${cliente.numeroDocumento}-${cliente.dv}`
                : `${cliente.tipoDocumento} ${cliente.numeroDocumento}`}
            </p>
          </div>
          <button
            onClick={() => onAsignar(null)}
            className="text-cream/60 text-xs"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <p className="text-cream/60 text-xs mb-1.5">
        Cliente (requerido para crédito)
      </p>

      {!mostrarFormulario ? (
        <>
          <input
            type="text"
            value={busqueda}
            onFocus={abrirBuscador}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por documento o nombre..."
            className="w-full bg-cream/10 border border-cream/20 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel placeholder:text-cream/40"
          />
          {resultados.length > 0 && (
            <div className="mt-2 bg-cream/10 rounded-lg overflow-hidden">
              {resultados.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    onAsignar({
                      id: t.id,
                      nombreCompleto: t.nombreCompleto,
                      tipoDocumento: t.tipoDocumento,
                      numeroDocumento: t.numeroDocumento,
                      dv: t.dv,
                    })
                  }
                  className="w-full text-left px-3 py-2 text-sm hover:bg-cream/10 border-b border-cream/10 last:border-0"
                >
                  <p>{t.nombreCompleto}</p>
                  <p className="text-cream/50 text-xs">{formatoCliente(t)}</p>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setMostrarFormulario(true)}
            className="text-caramel text-xs mt-2"
          >
            + Nuevo cliente
          </button>
        </>
      ) : (
        <div className="bg-cream/10 border border-cream/20 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setNuevoTipoPersona("NATURAL")}
              className={`flex-1 text-xs py-1.5 rounded ${nuevoTipoPersona === "NATURAL" ? "bg-caramel text-espresso font-semibold" : "bg-cream/10 text-cream/60"}`}
            >
              Natural
            </button>
            <button
              onClick={() => setNuevoTipoPersona("JURIDICA")}
              className={`flex-1 text-xs py-1.5 rounded ${nuevoTipoPersona === "JURIDICA" ? "bg-caramel text-espresso font-semibold" : "bg-cream/10 text-cream/60"}`}
            >
              Jurídica
            </button>
          </div>
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder={
              nuevoTipoPersona === "JURIDICA"
                ? "Razón social"
                : "Nombre completo"
            }
            className="w-full bg-cream/10 border border-cream/20 rounded-lg px-3 py-2 text-sm outline-none placeholder:text-cream/40"
          />
          <input
            type="text"
            value={nuevoDocumento}
            onChange={(e) => setNuevoDocumento(e.target.value)}
            placeholder={nuevoTipoPersona === "JURIDICA" ? "NIT" : "Cédula"}
            className="w-full bg-cream/10 border border-cream/20 rounded-lg px-3 py-2 text-sm outline-none placeholder:text-cream/40"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setMostrarFormulario(false)}
              className="flex-1 text-xs py-2 text-cream/60"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              disabled={!nuevoNombre || !nuevoDocumento || creando}
              className="flex-1 bg-caramel text-espresso font-semibold text-xs py-2 rounded disabled:opacity-40"
            >
              {creando ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
