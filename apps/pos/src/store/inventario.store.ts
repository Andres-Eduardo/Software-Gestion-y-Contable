import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface Movimiento {
  id: string;
  productoId: string;
  producto: { id: string; nombre: string; codigo: string };
  bodegaOrigenId: string | null;
  bodegaOrigen: { id: string; nombre: string } | null;
  bodegaDestinoId: string | null;
  bodegaDestino: { id: string; nombre: string } | null;
  cantidad: string;
  tipoMovimiento: string;
  estado: string;
  createdAt: string;
}

interface InventarioState {
  movimientos: Movimiento[];
  stockPorProducto: Record<string, number>;
  cargando: boolean;
  cargarMovimientos: (token: string) => Promise<void>;
  cargarStock: (
    token: string,
    sedeId: string,
    productoIds: string[],
  ) => Promise<void>;
  solicitarTraslado: (
    token: string,
    datos: {
      productoId: string;
      bodegaOrigenId: string;
      bodegaDestinoId: string;
      cantidad: number;
      observaciones?: string;
    },
  ) => Promise<{ id: string }>;
  despachar: (token: string, id: string) => Promise<void>;
  confirmar: (token: string, id: string) => Promise<void>;
}

export const useInventarioStore = create<InventarioState>((set, get) => ({
  movimientos: [],
  stockPorProducto: {},
  cargando: false,

  cargarMovimientos: async (token) => {
    set({ cargando: true });
    const movimientos = await apiFetch<Movimiento[]>(
      "/movimientos-inventario",
      { token },
    );
    set({ movimientos, cargando: false });
  },

  cargarStock: async (token, sedeId, productoIds) => {
    const resultados = await Promise.all(
      productoIds.map((id) =>
        apiFetch<{ stock: number }>(
          `/inventario/stock?sedeId=${sedeId}&productoId=${id}`,
          {
            token,
          },
        ),
      ),
    );
    const stockPorProducto: Record<string, number> = {};
    productoIds.forEach((id, i) => {
      stockPorProducto[id] = resultados[i].stock;
    });
    set({ stockPorProducto });
  },

  solicitarTraslado: async (token, datos) => {
    const creado = await apiFetch<{ id: string }>("/movimientos-inventario", {
      method: "POST",
      token,
      body: JSON.stringify(datos),
    });
    await get().cargarMovimientos(token);
    return creado;
  },

  despachar: async (token, id) => {
    await apiFetch(`/movimientos-inventario/${id}/despachar`, {
      method: "POST",
      token,
    });
    await get().cargarMovimientos(token);
  },

  confirmar: async (token, id) => {
    await apiFetch(`/movimientos-inventario/${id}/confirmar`, {
      method: "POST",
      token,
    });
    await get().cargarMovimientos(token);
  },
}));
