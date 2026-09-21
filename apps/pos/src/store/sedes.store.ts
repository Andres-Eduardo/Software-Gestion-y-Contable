import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface Sede {
  id: string;
  nombre: string;
  tipo: string;
}

interface SedesState {
  sedes: Sede[];
  cargarSedes: (token: string) => Promise<void>;
}

export const useSedesStore = create<SedesState>((set, get) => ({
  sedes: [],

  cargarSedes: async (token) => {
    if (get().sedes.length > 0) return;
    const sedes = await apiFetch<Sede[]>("/sedes", { token });
    set({ sedes });
  },
}));
