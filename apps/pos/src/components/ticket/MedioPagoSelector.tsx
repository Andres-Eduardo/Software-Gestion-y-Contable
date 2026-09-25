import { useTicketsStore, type Ticket } from "../../store/tickets.store";

interface Props {
  ticket: Ticket;
}

const OPCIONES_ELECTRONICO = [
  { valor: "NEQUI", etiqueta: "Nequi" },
  { valor: "BANCOLOMBIA", etiqueta: "Bancolombia" },
  { valor: "TRANSFERENCIA", etiqueta: "Otro" },
] as const;

export default function MedioPagoSelector({ ticket }: Props) {
  const setMedioPagoTipo = useTicketsStore((s) => s.setMedioPagoTipo);
  const setMedioPagoElectronico = useTicketsStore(
    (s) => s.setMedioPagoElectronico,
  );

  return (
    <div className="mb-3">
      <p className="text-cream/60 text-xs mb-1.5">Medio de pago</p>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setMedioPagoTipo(ticket.id, "EFECTIVO")}
          className={
            ticket.medioPagoTipo === "EFECTIVO"
              ? "flex-1 py-2 rounded-lg bg-caramel text-espresso text-sm font-semibold"
              : "flex-1 py-2 rounded-lg border border-cream/20 text-cream/60 text-sm"
          }
        >
          Efectivo
        </button>
        <button
          onClick={() => setMedioPagoTipo(ticket.id, "ELECTRONICO")}
          className={
            ticket.medioPagoTipo === "ELECTRONICO"
              ? "flex-1 py-2 rounded-lg bg-caramel text-espresso text-sm font-semibold"
              : "flex-1 py-2 rounded-lg border border-cream/20 text-cream/60 text-sm"
          }
        >
          Electrónico
        </button>
      </div>

      {ticket.medioPagoTipo === "ELECTRONICO" && (
        <div className="flex gap-2 flex-wrap">
          {OPCIONES_ELECTRONICO.map((op) => (
            <button
              key={op.valor}
              onClick={() => setMedioPagoElectronico(ticket.id, op.valor)}
              className={
                ticket.medioPagoElectronico === op.valor
                  ? "px-3.5 py-1.5 rounded-full bg-cream/20 text-cream text-xs font-semibold"
                  : "px-3.5 py-1.5 rounded-full bg-cream/5 text-cream/55 text-xs"
              }
            >
              {op.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
