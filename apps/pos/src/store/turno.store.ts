import { create } from "zustand";
import { apiFetch } from "../api/client";
import { useAuthStore } from "./auth.store";

interface Turno {
  id: string;
  sedeId: string;
  efectivoInicial: string;
  estado: "ABIERTO" | "CERRADO";
}

interface TurnoState {
  turno: Turno | null;
  cargando: boolean;
  cargarTurnoActual: () => Promise<void>;
  abrirTurno: (efectivoInicial: number) => Promise<void>;
  reiniciar: () => void;
}

export const useTurnoStore = create<TurnoState>((set) => ({
  turno: null,
  cargando: true,

  cargarTurnoActual: async () => {
    const token = useAuthStore.getState().token!;
    set({ cargando: true });
    try {
      const turno = await apiFetch<Turno | null>("/turnos/actual", { token });
      set({ turno, cargando: false });
    } catch {
      set({ turno: null, cargando: false });
    }
  },

  abrirTurno: async (efectivoInicial: number) => {
    const token = useAuthStore.getState().token!;
    const turno = await apiFetch<Turno>("/turnos/apertura", {
      method: "POST",
      token,
      body: JSON.stringify({ efectivoInicial }),
    });
    set({ turno });
  },

  reiniciar: () => set({ turno: null, cargando: false }),
}));
