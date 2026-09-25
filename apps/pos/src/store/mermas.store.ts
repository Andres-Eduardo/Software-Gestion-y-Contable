import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface MotivoMerma {
  id: string;
  nombre: string;
  afectaCosto: boolean;
}

interface MermasState {
  motivos: MotivoMerma[];
  cargarMotivos: (token: string) => Promise<void>;
  registrarMerma: (
    token: string,
    datos: {
      productoId: string;
      bodegaOrigenId: string;
      cantidad: number;
      motivoMermaId: string;
      observaciones?: string;
    },
  ) => Promise<void>;
}

export const useMermasStore = create<MermasState>((set, get) => ({
  motivos: [],

  cargarMotivos: async (token) => {
    if (get().motivos.length > 0) return;
    const motivos = await apiFetch<MotivoMerma[]>("/motivos-merma", { token });
    set({ motivos });
  },

  registrarMerma: async (token, datos) => {
    await apiFetch("/movimientos-inventario/merma", {
      method: "POST",
      token,
      body: JSON.stringify(datos),
    });
  },
}));
