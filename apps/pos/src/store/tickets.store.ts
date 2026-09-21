import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductoVenta {
  id: string;
  nombre: string;
  precioVenta: number;
  aplicaInc: boolean;
}

export interface ItemCarrito extends ProductoVenta {
  cantidad: number;
}

export interface ClienteSeleccionado {
  id: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  dv?: number | null;
}

export interface Ticket {
  id: string;
  items: ItemCarrito[];
  esCredito: boolean;
  cliente: ClienteSeleccionado | null;
}

interface TicketsState {
  tickets: Ticket[];
  ticketActivoId: string;

  ventasCerradasCount: number;
  nuevoTicket: () => void;
  cerrarTicket: (ticketId: string) => void;
  seleccionarTicket: (ticketId: string) => void;
  marcarCredito: (ticketId: string, esCredito: boolean) => void;
  asignarCliente: (
    ticketId: string,
    cliente: ClienteSeleccionado | null,
  ) => void;
  agregarProducto: (ticketId: string, producto: ProductoVenta) => void;
  incrementar: (ticketId: string, productoId: string) => void;
  decrementar: (ticketId: string, productoId: string) => void;
  registrarVentaCerrada: () => void;
  reiniciar: () => void;
}

function crearTicketVacio(): Ticket {
  return {
    id: crypto.randomUUID(),
    items: [],
    esCredito: false,
    cliente: null,
  };
}

const ticketInicial = crearTicketVacio();

export const useTicketsStore = create<TicketsState>()(
  persist(
    (set) => ({
      tickets: [ticketInicial],
      ticketActivoId: ticketInicial.id,
      ventasCerradasCount: 0,

      nuevoTicket: () => {
        const nuevo = crearTicketVacio();
        set((state) => ({
          tickets: [...state.tickets, nuevo],
          ticketActivoId: nuevo.id,
        }));
      },

      cerrarTicket: (ticketId) =>
        set((state) => {
          const restantes = state.tickets.filter((t) => t.id !== ticketId);
          const tickets =
            restantes.length > 0 ? restantes : [crearTicketVacio()];
          const ticketActivoId =
            state.ticketActivoId === ticketId
              ? tickets[0].id
              : state.ticketActivoId;
          return { tickets, ticketActivoId };
        }),

      seleccionarTicket: (ticketId) => set({ ticketActivoId: ticketId }),

      marcarCredito: (ticketId, esCredito) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, esCredito, cliente: esCredito ? t.cliente : null }
              : t,
          ),
        })),

      asignarCliente: (ticketId, cliente) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, cliente } : t,
          ),
        })),

      agregarProducto: (ticketId, producto) =>
        set((state) => ({
          tickets: state.tickets.map((t) => {
            if (t.id !== ticketId) return t;
            const existente = t.items.find((i) => i.id === producto.id);
            const items = existente
              ? t.items.map((i) =>
                  i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
                )
              : [...t.items, { ...producto, cantidad: 1 }];
            return { ...t, items };
          }),
        })),

      incrementar: (ticketId, productoId) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  items: t.items.map((i) =>
                    i.id === productoId
                      ? { ...i, cantidad: i.cantidad + 1 }
                      : i,
                  ),
                }
              : t,
          ),
        })),

      decrementar: (ticketId, productoId) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  items: t.items
                    .map((i) =>
                      i.id === productoId
                        ? { ...i, cantidad: i.cantidad - 1 }
                        : i,
                    )
                    .filter((i) => i.cantidad > 0),
                }
              : t,
          ),
        })),

      registrarVentaCerrada: () =>
        set((state) => ({
          ventasCerradasCount: state.ventasCerradasCount + 1,
        })),

      reiniciar: () => {
        const nuevo = crearTicketVacio();
        set({
          tickets: [nuevo],
          ticketActivoId: nuevo.id,
          ventasCerradasCount: 0,
        });
      },
    }),

    { name: "opa-tickets" },
  ),
);

export function useTicketActivo(): Ticket {
  return useTicketsStore(
    (state) =>
      state.tickets.find((t) => t.id === state.ticketActivoId) ??
      state.tickets[0],
  );
}

const INC_PORCENTAJE = 8;
const IVA_PORCENTAJE = 19;

// Solo para vista previa — el backend recalcula todo al crear la factura.
export function calcularTotalesTicket(items: ItemCarrito[]) {
  let subtotal = 0;
  let totalInc = 0;
  let totalIva = 0;

  for (const item of items) {
    const base = item.precioVenta * item.cantidad;
    subtotal += base;
    if (item.aplicaInc) {
      totalInc += (base * INC_PORCENTAJE) / 100;
    } else {
      totalIva += (base * IVA_PORCENTAJE) / 100;
    }
  }

  return {
    subtotal,
    totalInc,
    totalIva,
    total: subtotal + totalInc + totalIva,
  };
}
