import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { useTurnoStore } from "../store/turno.store";
import { useTicketsStore, useTicketActivo } from "../store/tickets.store";
import AperturaTurno from "../components/AperturaTurno";
import ProductoCard from "../components/ProductoCard";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";
import TicketPanel from "../components/ticket/TicketPanel";
import TicketSheet from "../components/ticket/TicketSheet";
import { IconSearch, IconMic } from "../components/icons";
import { interpretarComandoVoz } from "../utils/comandoVoz";

interface ProductoApi {
  id: string;
  nombre: string;
  tipo: string;
  precioVenta: string | null;
  aplicaInc: boolean;
}

export default function VentaPage() {
  const token = useAuthStore((s) => s.token)!;
  const { turno, cargando: cargandoTurno, cargarTurnoActual } = useTurnoStore();
  const agregarProducto = useTicketsStore((s) => s.agregarProducto);
  const ticket = useTicketActivo();

  const [productos, setProductos] = useState<ProductoApi[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [mensajeVoz, setMensajeVoz] = useState<string | null>(null);

  useEffect(() => {
    cargarTurnoActual();
  }, [cargarTurnoActual]);

  useEffect(() => {
    if (!turno) return;
    apiFetch<ProductoApi[]>("/productos", { token }).then(setProductos);
  }, [turno, token]);

  if (cargandoTurno) {
    return <div className="min-h-screen bg-paper" />;
  }

  if (!turno) {
    return <AperturaTurno />;
  }

  const productosVendibles = productos
    .filter((p) => p.tipo !== "INSUMO" && p.precioVenta !== null)
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  function handleVoz() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMensajeVoz(
        "Tu navegador no soporta reconocimiento de voz (usa Chrome o Edge).",
      );
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-CO";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setEscuchando(true);
    setMensajeVoz(null);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;
      const resultado = interpretarComandoVoz(transcript, productosVendibles);

      if (resultado) {
        for (let i = 0; i < resultado.cantidad; i++) {
          agregarProducto(ticket.id, {
            id: resultado.producto.id,
            nombre: resultado.producto.nombre,
            precioVenta: Number(resultado.producto.precioVenta),
            aplicaInc: resultado.producto.aplicaInc,
          });
        }
        setMensajeVoz(
          `Agregado: ${resultado.cantidad} × ${resultado.producto.nombre}`,
        );
      } else {
        setMensajeVoz(`No entendí "${transcript}". Intenta de nuevo.`);
      }
    };

    recognition.onerror = () => {
      setMensajeVoz("No se pudo escuchar. Intenta de nuevo.");
    };

    recognition.onend = () => setEscuchando(false);

    recognition.start();
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <NavTabs />

        <div className="p-4 md:p-6 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto..."
                aria-label="Buscar producto"
                className="w-full rounded-lg border border-ink/15 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>
            <button
              onClick={handleVoz}
              disabled={escuchando}
              aria-label="Agregar producto por voz"
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition ${
                escuchando
                  ? "bg-caramel text-espresso animate-pulse"
                  : "bg-white border border-ink/15 text-ink/60"
              }`}
            >
              <IconMic />
            </button>
          </div>
          {mensajeVoz && (
            <p className="text-xs text-ink/50 mb-3">{mensajeVoz}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-24 md:pb-0">
            {productosVendibles.map((p) => (
              <ProductoCard
                key={p.id}
                nombre={p.nombre}
                precioVenta={Number(p.precioVenta)}
                onClick={() =>
                  agregarProducto(ticket.id, {
                    id: p.id,
                    nombre: p.nombre,
                    precioVenta: Number(p.precioVenta),
                    aplicaInc: p.aplicaInc,
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>

      <TicketPanel />
      <TicketSheet />
    </div>
  );
}
