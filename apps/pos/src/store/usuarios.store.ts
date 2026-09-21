import { create } from "zustand";
import { apiFetch } from "../api/client";

export interface UsuarioAdmin {
  id: string;
  nombreCompleto: string;
  email: string | null;
  documento: string | null;
  rol: string;
  sedeId: string | null;
  activo: boolean;
  sede: { id: string; nombre: string } | null;
}

interface UsuariosState {
  usuarios: UsuarioAdmin[];
  cargando: boolean;
  cargarUsuarios: (token: string) => Promise<void>;
  crearUsuario: (
    token: string,
    datos: {
      nombreCompleto: string;
      email: string;
      password: string;
      rol: string;
      sedeId?: string;
    },
  ) => Promise<void>;
  actualizarUsuario: (
    token: string,
    id: string,
    cambios: Partial<
      Pick<UsuarioAdmin, "nombreCompleto" | "rol" | "sedeId" | "activo">
    >,
  ) => Promise<void>;
}

export const useUsuariosStore = create<UsuariosState>((set, get) => ({
  usuarios: [],
  cargando: false,

  cargarUsuarios: async (token) => {
    set({ cargando: true });
    const usuarios = await apiFetch<UsuarioAdmin[]>("/usuarios", { token });
    set({ usuarios, cargando: false });
  },

  crearUsuario: async (token, datos) => {
    const nuevo = await apiFetch<UsuarioAdmin>("/usuarios", {
      method: "POST",
      token,
      body: JSON.stringify(datos),
    });
    set({ usuarios: [nuevo, ...get().usuarios] });
  },

  actualizarUsuario: async (token, id, cambios) => {
    const actualizado = await apiFetch<UsuarioAdmin>(`/usuarios/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(cambios),
    });
    set({
      usuarios: get().usuarios.map((u) => (u.id === id ? actualizado : u)),
    });
  },
}));
