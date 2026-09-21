import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface VentaPorSede {
  sedeId: string;
  sedeNombre: string;
  cantidadFacturas: number;
  total: number;
}

export interface TurnoDescuadrado {
  id: string;
  descuadre: string;
  sede: { id: string; nombre: string };
  usuarioCierre: { id: string; nombreCompleto: string } | null;
}

export interface ArqueoDescuadrado {
  id: string;
  descuadre: string;
  auditoria: { maquina: { codigo: string; nombre: string | null } };
}

export interface CuentaVencida {
  id: string;
  saldoPendiente: string;
  tercero: { nombreCompleto: string };
}

interface ReportesState {
  ventas: VentaPorSede[];
  turnosDescuadrados: TurnoDescuadrado[];

  arqueosDescuadrados: ArqueoDescuadrado[];
  cuentasPorCobrarVencidas: CuentaVencida[];
  cuentasPorPagarVencidas: CuentaVencida[];
  cargando: boolean;
  cargarTodo: (token: string) => Promise<void>;
}

export const useReportesStore = create<ReportesState>((set) => ({
  ventas: [],
  turnosDescuadrados: [],
  arqueosDescuadrados: [],
  cuentasPorCobrarVencidas: [],
  cuentasPorPagarVencidas: [],
  cargando: false,

  cargarTodo: async (token) => {
    set({ cargando: true });
    const [ventas, descuadres, vencidas] = await Promise.all([
      apiFetch<VentaPorSede[]>("/reportes/ventas", { token }),
      apiFetch<{
        turnosDescuadrados: TurnoDescuadrado[];
        arqueosDescuadrados: ArqueoDescuadrado[];
      }>("/reportes/descuadres", { token }),
      apiFetch<{
        cuentasPorCobrarVencidas: CuentaVencida[];
        cuentasPorPagarVencidas: CuentaVencida[];
      }>("/reportes/cuentas-vencidas", { token }),
    ]);
    set({
      ventas,
      turnosDescuadrados: descuadres.turnosDescuadrados,
      arqueosDescuadrados: descuadres.arqueosDescuadrados,

      cuentasPorCobrarVencidas: vencidas.cuentasPorCobrarVencidas,
      cuentasPorPagarVencidas: vencidas.cuentasPorPagarVencidas,
      cargando: false,
    });
  },
}));
