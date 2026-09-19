import { useState } from "react";
import {
  useTicketActivo,
  calcularTotalesTicket,
} from "../../store/tickets.store";
import TicketContent from "./TicketContent";
import { IconChevronUp } from "../icons";

export default function TicketSheet() {
  const [expandido, setExpandido] = useState(false);
  const ticket = useTicketActivo();
  const { total } = calcularTotalesTicket(ticket.items);

  return (
    <div className="md:hidden">
      {expandido && (
        <>
          <button
            aria-label="Cerrar ticket"
            onClick={() => setExpandido(false)}
            className="fixed inset-0 bg-espresso/45 z-40"
          />
          <div className="fixed left-0 right-0 bottom-0 z-50 bg-toffee text-cream rounded-t-2xl p-5 pb-6 shadow-2xl max-h-[85vh] flex flex-col">
            <button
              aria-label="Colapsar ticket"
              onClick={() => setExpandido(false)}
              className="w-10 h-1 rounded-full bg-cream/30 mx-auto mb-3 shrink-0"
            />
            <div className="overflow-y-auto">
              <TicketContent />
            </div>
          </div>
        </>
      )}

      {!expandido && ticket.items.length > 0 && (
        <button
          onClick={() => setExpandido(true)}
          className="fixed left-3 right-3 bottom-4 z-30 bg-toffee text-cream rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-lg"
        >
          <div className="text-left">
            <div className="text-xs text-cream/60">
              {ticket.items.reduce((acc, i) => acc + i.cantidad, 0)} productos
            </div>
            <div className="text-caramel font-semibold tabular-nums">
              ${total.toLocaleString("es-CO")}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            Ver ticket <IconChevronUp />
          </div>
        </button>
      )}
    </div>
  );
}
