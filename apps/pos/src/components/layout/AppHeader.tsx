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
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label="Abrir menú de usuario"
          className="md:hidden w-8 h-8 rounded-full bg-caramel text-espresso flex items-center justify-center text-xs font-bold"
        >
          {iniciales}
        </button>
      </div>

      {menuAbierto && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-paper border-b border-ink/10 shadow-lg z-20 p-4">
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide mb-3">
            Secciones
          </p>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {secciones.map((seccion) => {
              const Icono = ICONO_SECCION[seccion];
              return (
                <NavLink
                  key={seccion}
                  to={RUTA_SECCION[seccion]}
                  onClick={() => setMenuAbierto(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-2 rounded-xl border bg-white py-4 px-3 ${
                      isActive ? "border-caramel/50" : "border-ink/10"
                    }`
                  }
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      <Icono
                        className={isActive ? "text-caramel" : "text-ink"}
                      />
                      <span
                        className={
                          isActive
                            ? "text-sm font-semibold text-espresso"
                            : "text-sm text-ink/70"
                        }
                      >
                        {NOMBRE_SECCION[seccion]}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {turno && (
            <Link
              to="/cerrar-turno"
              onClick={() => setMenuAbierto(false)}
              className="block text-sm text-brick font-medium py-2 border-t border-ink/10 pt-3"
            >
              Cerrar turno
            </Link>
          )}

          <button
            onClick={cerrarSesion}
            className="block w-full text-left text-sm text-brick font-medium py-2 border-t border-ink/10 pt-3 mt-1"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
