import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface TurnoAdmin {
  id: string;
  sedeId: string;
  sede: { id: string; nombre: string; tipo: string };
  usuarioApertura: { id: string; nombreCompleto: string; rol: string };
  usuarioCierre: { id: string; nombreCompleto: string; rol: string } | null;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: string;
  ventaEnCurso?: number;
}

interface VentaReporte {
  total: number;
}

interface TurnosAdminState {
  turnos: TurnoAdmin[];
  cargando: boolean;
  cargarTurnos: (token: string) => Promise<void>;
}

export const useTurnosAdminStore = create<TurnosAdminState>((set) => ({
  turnos: [],
  cargando: false,

  cargarTurnos: async (token) => {
    set({ cargando: true });
    const turnos = await apiFetch<TurnoAdmin[]>("/turnos", { token });

    const conVentas = await Promise.all(
      turnos.map(async (t) => {
        if (t.estado !== "ABIERTO") return t;
        try {
          const reporte = await apiFetch<VentaReporte[]>(
            `/reportes/ventas?turnoId=${t.id}`,
            {
              token,
            },
          );
          const total = reporte.reduce((acc, r) => acc + r.total, 0);
          return { ...t, ventaEnCurso: total };
        } catch {
          return { ...t, ventaEnCurso: 0 };
        }
      }),
    );

    set({ turnos: conVentas, cargando: false });
  },
}));
