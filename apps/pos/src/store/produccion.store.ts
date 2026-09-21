import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface RecetaDetalle {
  id: string;
  insumoId: string;
  cantidad: string;
  unidadMedidaId: string;
}

export interface Receta {
  id: string;
  nombre: string;
  rendimiento: string;
  activa: boolean;
  producto: { id: string; nombre: string };
  detalles: RecetaDetalle[];
}

export interface LoteInsumo {
  id: string;
  insumoId: string;
  cantidadTeorica: string;
  cantidadReal: string | null;
  variacion: string | null;
}

export interface Lote {
  id: string;
  recetaId: string;
  receta: { id: string; nombre: string };
  sedeId: string;

  usuario: { id: string; nombreCompleto: string; rol: string };
  cantidadProducidaReal: string | null;
  estado: string;
  fechaProduccion: string;
  insumos: LoteInsumo[];
}

interface ProduccionState {
  recetas: Receta[];
  lotes: Lote[];
  cargarRecetas: (token: string) => Promise<void>;
  cargarLotes: (token: string) => Promise<void>;
  abrirLote: (token: string, recetaId: string, sedeId: string) => Promise<void>;
  cerrarLote: (
    token: string,
    loteId: string,
    datos: {
      cantidadProducidaReal: number;
      insumos: { insumoId: string; cantidadReal: number }[];
      observaciones?: string;
    },
  ) => Promise<void>;
}

export const useProduccionStore = create<ProduccionState>((set, get) => ({
  recetas: [],
  lotes: [],

  cargarRecetas: async (token) => {
    const recetas = await apiFetch<Receta[]>("/recetas", { token });
    set({ recetas });
  },

  cargarLotes: async (token) => {
    const lotes = await apiFetch<Lote[]>("/lotes-produccion", { token });
    set({ lotes });
  },

  abrirLote: async (token, recetaId, sedeId) => {
    await apiFetch("/lotes-produccion", {
      method: "POST",
      token,
      body: JSON.stringify({ recetaId, sedeId }),
    });
    await get().cargarLotes(token);
  },

  cerrarLote: async (token, loteId, datos) => {
    await apiFetch(`/lotes-produccion/${loteId}/cerrar`, {
      method: "POST",
      token,
      body: JSON.stringify(datos),
    });
    await get().cargarLotes(token);
  },
}));
