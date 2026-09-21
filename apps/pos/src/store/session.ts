import { useAuthStore } from "./auth.store";
import { useTurnoStore } from "./turno.store";
import { useTicketsStore } from "./tickets.store";

export function cerrarSesion() {
  useTicketsStore.getState().reiniciar();
  useTurnoStore.getState().reiniciar();
  useAuthStore.getState().logout();
}
