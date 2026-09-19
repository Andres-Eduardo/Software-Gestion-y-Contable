import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface Tercero {
  id: string;
  tipoPersona: "NATURAL" | "JURIDICA";
  tipoDocumento: "CC" | "NIT" | "CE" | "PASAPORTE";
  numeroDocumento: string;
  nombreCompleto: string;
  dv: number | null;
}

interface TercerosState {
  terceros: Tercero[];
  cargando: boolean;
  cargarTerceros: (token: string) => Promise<void>;
  crearTercero: (
    token: string,
    datos: Omit<Tercero, "id" | "dv">,
  ) => Promise<Tercero>;
}

export const useTercerosStore = create<TercerosState>((set, get) => ({
  terceros: [],
  cargando: false,

  cargarTerceros: async (token) => {
    if (get().terceros.length > 0) return;
    set({ cargando: true });
    const terceros = await apiFetch<Tercero[]>("/terceros", { token });
    set({ terceros, cargando: false });
  },

  crearTercero: async (token, datos) => {
    const nuevo = await apiFetch<Tercero>("/terceros", {
      method: "POST",
      token,
      body: JSON.stringify(datos),
    });
    set((state) => ({ terceros: [nuevo, ...state.terceros] }));
    return nuevo;
  },
}));
