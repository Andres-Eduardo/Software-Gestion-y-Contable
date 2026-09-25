import { useState } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useTurnoStore } from "../../store/turno.store";
import {
  useTicketsStore,
  useTicketActivo,
  calcularTotalesTicket,
} from "../../store/tickets.store";
import { apiFetch } from "../../api/client";
import TicketSelector from "./TicketSelector";
import TicketItemsList from "./TicketItemsList";
import ClienteCredito from "./ClienteCredito";
import MedioPagoSelector from "./MedioPagoSelector";
import ReciboModal from "./ReciboModal";
import AvisoAbrirTurno from "./AvisoAbrirTurno";

export default function TicketContent() {
  const token = useAuthStore((s) => s.token)!;
  const turno = useTurnoStore((s) => s.turno);
  const ticket = useTicketActivo();
  const marcarCredito = useTicketsStore((s) => s.marcarCredito);
  const asignarCliente = useTicketsStore((s) => s.asignarCliente);
  const cerrarTicket = useTicketsStore((s) => s.cerrarTicket);
  const registrarVentaCerrada = useTicketsStore((s) => s.registrarVentaCerrada);
  const ventasCerradasCount = useTicketsStore((s) => s.ventasCerradasCount);

  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facturaParaRecibo, setFacturaParaRecibo] = useState<{
    id: string;
    prefijo: string;
    numero: number;

    total: string;
  } | null>(null);
  const [mostrarAvisoTurno, setMostrarAvisoTurno] = useState(false);

  const { subtotal, totalInc, totalIva, total } = calcularTotalesTicket(
    ticket.items,
  );
  const puedeCobrar =
    ticket.items.length > 0 && (!ticket.esCredito || ticket.cliente !== null);

  function medioPagoParaEnviar(): string {
    if (ticket.esCredito) return "CREDITO";
    if (ticket.medioPagoTipo === "ELECTRONICO")
      return ticket.medioPagoElectronico;
    return "EFECTIVO";
  }

  async function procesarCobro() {
    const turnoActual = useTurnoStore.getState().turno;
    if (!turnoActual) return;

    setCobrando(true);
    setError(null);
    try {
      const factura = await apiFetch<{
        id: string;
        prefijo: string;
        numero: number;
        total: string;
      }>("/facturas", {
        method: "POST",
        token,
        body: JSON.stringify({
          sedeId: turnoActual.sedeId,
          terceroId: ticket.esCredito ? ticket.cliente?.id : undefined,
          detalles: ticket.items.map((i) => ({
            productoId: i.id,
            cantidad: i.cantidad,
          })),
          pagos: [{ medioPago: medioPagoParaEnviar(), monto: total }],
        }),
      });
      registrarVentaCerrada();
      cerrarTicket(ticket.id);
      setFacturaParaRecibo(factura);
    } catch (err: any) {
      setError(err.message ?? "No se pudo procesar la venta.");
    } finally {
      setCobrando(false);
    }
  }

  function handleCobrar() {
    if (!puedeCobrar) return;
    if (!turno) {
      setMostrarAvisoTurno(true);
      return;
    }
    procesarCobro();
  }

  return (
    <div className="flex flex-col h-full">
      <TicketSelector />

      <button className="flex items-center justify-between text-cream/60 text-xs mb-3">
        <span>Ventas del turno · {ventasCerradasCount}</span>
      </button>

      <h2 className="font-display text-xl mb-3">Venta actual</h2>

      <label className="flex items-center gap-2 mb-3 text-sm text-cream/70 cursor-pointer">
        <input
          type="checkbox"
          checked={ticket.esCredito}
          onChange={(e) => marcarCredito(ticket.id, e.target.checked)}
          className="accent-caramel"
        />
        Venta a crédito
      </label>

      {ticket.esCredito ? (
        <ClienteCredito
          cliente={ticket.cliente}
          onAsignar={(c) => asignarCliente(ticket.id, c)}
        />
      ) : (
        <MedioPagoSelector ticket={ticket} />
      )}

      <div className="flex-1 min-h-0">
        <TicketItemsList ticketId={ticket.id} items={ticket.items} />
      </div>

      {error && <p className="text-brick text-xs mb-2">{error}</p>}

      <div className="space-y-1 text-sm mb-4">
        <div className="flex justify-between text-cream/70">
          <span>Subtotal</span>
          <span className="tabular-nums">
            ${subtotal.toLocaleString("es-CO")}
          </span>
        </div>
        {totalInc > 0 && (
          <div className="flex justify-between text-cream/70">
            <span>INC</span>
            <span className="tabular-nums">
              ${totalInc.toLocaleString("es-CO")}
            </span>
          </div>
        )}
        {totalIva > 0 && (
          <div className="flex justify-between text-cream/70">
            <span>IVA</span>
            <span className="tabular-nums">
              ${totalIva.toLocaleString("es-CO")}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xl font-semibold pt-2">
          <span>Total</span>
          <span className="text-caramel tabular-nums">
            ${total.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      <button
        onClick={handleCobrar}
        disabled={!puedeCobrar || cobrando}
        className="w-full bg-caramel disabled:opacity-40 text-espresso font-semibold rounded-lg py-3 hover:brightness-95 transition"
      >
        {cobrando ? "Procesando..." : "Cobrar"}
      </button>

      {facturaParaRecibo && (
        <ReciboModal
          factura={facturaParaRecibo}
          onClose={() => setFacturaParaRecibo(null)}
        />
      )}

      {mostrarAvisoTurno && (
        <AvisoAbrirTurno
          onListo={() => {
            setMostrarAvisoTurno(false);
            procesarCobro();
          }}
          onCancelar={() => setMostrarAvisoTurno(false)}
        />
      )}
    </div>
  );
}
