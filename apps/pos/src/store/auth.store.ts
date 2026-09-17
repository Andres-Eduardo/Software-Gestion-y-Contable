import { create } from "zustand";
import { apiFetch } from "../api/client";

interface UsuarioAutenticado {
  sub: string;
  rol: string;
  sedeId: string | null;
  empresaId: string;
}

interface AuthState {
  token: string | null;
  usuario: UsuarioAutenticado | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

function decodificarToken(token: string): UsuarioAutenticado {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("opa_token"),
  usuario: localStorage.getItem("opa_token")
    ? decodificarToken(localStorage.getItem("opa_token")!)
    : null,

  login: async (email: string, password: string) => {
    const { token } = await apiFetch<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("opa_token", token);
    set({ token, usuario: decodificarToken(token) });
  },

  logout: () => {
    localStorage.removeItem("opa_token");
    set({ token: null, usuario: null });
  },
}));
