import { Link } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";
import { ICONO_SECCION, NOMBRE_SECCION, RUTA_SECCION } from "../utils/roles";

const ACCESOS_DIRECTOS = [
  "inventario",
  "produccion",
  "reportes",
  "usuarios",
] as const;

export default function InicioPage() {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-6 md:p-8">
        <h1 className="font-display text-3xl text-espresso mb-1">
          Panel general
        </h1>
        <p className="text-ink/60 mb-6">
          Accesos rápidos a la operación de Opa.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ACCESOS_DIRECTOS.map((seccion) => {
            const Icono = ICONO_SECCION[seccion];
            return (
              <Link
                key={seccion}
                to={RUTA_SECCION[seccion]}
                className="bg-white border border-ink/10 rounded-xl p-5 hover:border-caramel hover:bg-caramel/5 transition"
              >
                <Icono className="text-caramel mb-2" />
                <p className="text-ink font-medium">
                  {NOMBRE_SECCION[seccion]}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
