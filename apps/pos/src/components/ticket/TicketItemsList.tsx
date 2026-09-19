import { useTicketsStore, type ItemCarrito } from "../../store/tickets.store";

interface Props {
  ticketId: string;
  items: ItemCarrito[];
}

export default function TicketItemsList({ ticketId, items }: Props) {
  const incrementar = useTicketsStore((s) => s.incrementar);
  const decrementar = useTicketsStore((s) => s.decrementar);

  if (items.length === 0) {
    return (
      <p className="text-cream/50 text-sm mb-4">
        Toca un producto para agregarlo.
      </p>
    );
  }

  return (
    <div className="relative mb-4">
      <div className="max-h-56 overflow-y-auto flex flex-col gap-3 pb-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{item.nombre}</p>
              <p className="text-cream/50 text-xs tabular-nums">
                ${item.precioVenta.toLocaleString("es-CO")} c/u
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => decrementar(ticketId, item.id)}
                className="w-6 h-6 rounded-full bg-cream/10 hover:bg-cream/20 text-sm"
              >
                −
              </button>
              <span className="w-4 text-center tabular-nums text-sm">
                {item.cantidad}
              </span>
              <button
                onClick={() => incrementar(ticketId, item.id)}
                className="w-6 h-6 rounded-full bg-cream/10 hover:bg-cream/20 text-sm"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length > 4 && (
        <div className="absolute left-0 right-1 bottom-0 h-7 bg-gradient-to-b from-transparent to-toffee pointer-events-none" />
      )}
    </div>
  );
}
