import { useTicketsStore } from "../../store/tickets.store";

export default function TicketSelector() {
  const tickets = useTicketsStore((s) => s.tickets);
  const ticketActivoId = useTicketsStore((s) => s.ticketActivoId);
  const seleccionarTicket = useTicketsStore((s) => s.seleccionarTicket);
  const nuevoTicket = useTicketsStore((s) => s.nuevoTicket);
  const cerrarTicket = useTicketsStore((s) => s.cerrarTicket);

  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      {tickets.map((ticket, index) => {
        const activo = ticket.id === ticketActivoId;
        const etiqueta = ticket.esCredito ? "Crédito" : `Ticket ${index + 1}`;
        return (
          <div
            key={ticket.id}
            className={`flex items-center gap-1 rounded-full pl-3 pr-1.5 py-1 ${
              activo ? "bg-cream/15" : ""
            }`}
          >
            <button
              onClick={() => seleccionarTicket(ticket.id)}
              className={
                activo
                  ? "text-cream font-semibold text-sm"
                  : "text-cream/55 text-sm"
              }
              style={
                activo && ticket.esCredito ? { color: "#D89B4A" } : undefined
              }
            >
              {etiqueta}
            </button>
            {tickets.length > 1 && (
              <button
                onClick={() => cerrarTicket(ticket.id)}
                aria-label={`Cerrar ${etiqueta}`}
                className="w-4 h-4 rounded-full flex items-center justify-center text-cream/40 hover:text-cream hover:bg-cream/10 text-xs leading-none"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={nuevoTicket}
        aria-label="Nuevo ticket"
        className="w-6.5 h-6.5 rounded-full border border-dashed border-cream/30 text-cream/60 flex items-center justify-center text-sm"
      >
        +
      </button>
    </div>
  );
}
