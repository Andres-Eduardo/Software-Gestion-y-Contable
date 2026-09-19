import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import {
  seccionesVisibles,
  NOMBRE_SECCION,
  RUTA_SECCION,
  ICONO_SECCION,
} from "../../utils/roles";
import { IconMenu } from "../icons";

export default function AppHeader() {
  const logout = useAuthStore((s) => s.logout);
  const rol = useAuthStore((s) => s.usuario?.rol);
  const secciones = seccionesVisibles(rol);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const iniciales = "JP"; // TODO: derivar del nombre real cuando el token lo incluya

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 md:px-7 py-3.5 border-b border-ink/10">
        <button
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label="Abrir menú"
          className="md:hidden text-ink"
        >
          <IconMenu />
        </button>

        <h1 className="font-display text-xl md:text-2xl text-espresso">Opa</h1>

        <div className="hidden md:flex items-center gap-5 text-sm text-ink/60">
          <span className="text-ink font-medium">{iniciales}</span>
          <button onClick={logout} className="hover:text-brick transition">
            Cerrar sesión
          </button>
        </div>

        <button
          onClick={logout}
          className="md:hidden w-8 h-8 rounded-full bg-caramel text-espresso flex items-center justify-center text-xs font-bold"
        >
          {iniciales}
        </button>
      </div>

      {menuAbierto && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-ink/10 shadow-lg z-20">
          {secciones.map((seccion) => {
            const Icono = ICONO_SECCION[seccion];
            return (
              <NavLink
                key={seccion}
                to={RUTA_SECCION[seccion]}
                onClick={() => setMenuAbierto(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm text-ink border-b border-ink/5 last:border-0"
              >
                <Icono />
                {NOMBRE_SECCION[seccion]}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
