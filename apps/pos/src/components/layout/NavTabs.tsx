import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import {
  seccionesVisibles,
  NOMBRE_SECCION,
  RUTA_SECCION,
  ICONO_SECCION,
} from "../../utils/roles";

export default function NavTabs() {
  const rol = useAuthStore((s) => s.usuario?.rol);
  const secciones = seccionesVisibles(rol);

  return (
    <nav className="hidden md:flex px-7 border-b border-ink/10">
      {secciones.map((seccion) => {
        const Icono = ICONO_SECCION[seccion];
        return (
          <NavLink
            key={seccion}
            to={RUTA_SECCION[seccion]}
            className={({ isActive }) =>
              `flex items-center gap-2 py-3.5 mr-7 text-sm border-b-2 ${
                isActive
                  ? "border-caramel text-espresso font-semibold"
                  : "border-transparent text-ink/50"
              }`
            }
          >
            <Icono />
            {NOMBRE_SECCION[seccion]}
          </NavLink>
        );
      })}
    </nav>
  );
}
