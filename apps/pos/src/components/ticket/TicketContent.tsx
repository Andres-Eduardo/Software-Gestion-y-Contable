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

  const { subtotal, totalInc, totalIva, total } = calcularTotalesTicket(
    ticket.items,
  );
  const puedeCobrar =
    ticket.items.length > 0 && (!ticket.esCredito || ticket.cliente !== null);

  async function handleCobrar() {
    if (!puedeCobrar || !turno) return;
    setCobrando(true);
    setError(null);
    try {
      await apiFetch("/facturas", {
        method: "POST",
        token,
        body: JSON.stringify({
          sedeId: turno.sedeId,
          terceroId: ticket.esCredito ? ticket.cliente?.id : undefined,
          detalles: ticket.items.map((i) => ({
            productoId: i.id,
            cantidad: i.cantidad,
          })),
          pagos: [
            {
              medioPago: ticket.esCredito ? "CREDITO" : "EFECTIVO",
              monto: total,
            },
          ],
        }),
      });
      registrarVentaCerrada();
      cerrarTicket(ticket.id);
    } catch (err: any) {
      setError(err.message ?? "No se pudo procesar la venta.");
    } finally {
      setCobrando(false);
    }
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

      {ticket.esCredito && (
        <ClienteCredito
          cliente={ticket.cliente}
          onAsignar={(c) => asignarCliente(ticket.id, c)}
        />
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
    </div>
  );
}
