import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useTurnoStore } from "../../store/turno.store";
import { cerrarSesion } from "../../store/session";
import {
  seccionesVisibles,
  NOMBRE_SECCION,
  RUTA_SECCION,
  ICONO_SECCION,
} from "../../utils/roles";
import { obtenerIniciales } from "../../utils/nombre";
import { IconMenu } from "../icons";

export default function AppHeader() {
  const usuario = useAuthStore((s) => s.usuario);
  const turno = useTurnoStore((s) => s.turno);
  const secciones = seccionesVisibles(usuario?.rol);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const iniciales = obtenerIniciales(usuario?.nombreCompleto);

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
          <span className="text-ink font-medium">
            {usuario?.nombreCompleto ?? "—"}
          </span>

          {turno && (
            <Link to="/cerrar-turno" className="hover:text-espresso transition">
              Cerrar turno
            </Link>
          )}
          <button
            onClick={cerrarSesion}
            className="hover:text-brick transition"
          >
            Cerrar sesión
          </button>
        </div>

        <button
          onClick={cerrarSesion}
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
          {turno && (
            <Link
              to="/cerrar-turno"
              onClick={() => setMenuAbierto(false)}
              className="flex items-center gap-3 px-5 py-3 text-sm text-brick border-b border-ink/5"
            >
              Cerrar turno
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
