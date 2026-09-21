import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useTurnosAdminStore } from "../store/turnos-admin.store";
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
  const token = useAuthStore((s) => s.token)!;
  const { turnos, cargando, cargarTurnos } = useTurnosAdminStore();

  useEffect(() => {
    cargarTurnos(token);
  }, [token]);

  const turnosAbiertos = turnos.filter((t) => t.estado === "ABIERTO");

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-4 md:p-8">
        <h1 className="font-display text-2xl md:text-3xl text-espresso mb-1">
          Panel general
        </h1>
        <p className="text-ink/60 text-sm mb-6">
          Accesos rápidos a la operación de Opa.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {ACCESOS_DIRECTOS.map((seccion) => {
            const Icono = ICONO_SECCION[seccion];

            return (
              <Link
                key={seccion}
                to={RUTA_SECCION[seccion]}
                className="bg-white border border-ink/10 rounded-xl p-4 md:p-5 hover:border-caramel hover:bg-caramel/5 transition"
              >
                <Icono className="text-caramel mb-2" />
                <p className="text-ink font-medium text-sm md:text-base">
                  {NOMBRE_SECCION[seccion]}
                </p>
              </Link>
            );
          })}
        </div>

        <h2 className="font-display text-lg md:text-xl text-espresso mb-3">
          Turnos abiertos ahora
        </h2>

        {cargando && <p className="text-ink/50 text-sm">Cargando...</p>}
        {!cargando && turnosAbiertos.length === 0 && (
          <p className="text-ink/50 text-sm">
            No hay turnos abiertos en este momento.
          </p>
        )}

        {turnosAbiertos.length > 0 && (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden md:block bg-white border border-ink/10 rounded-xl overflow-hidden max-w-3xl">
              <table className="w-full text-sm">
                <thead className="bg-paper text-ink/60 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Sede</th>
                    <th className="px-4 py-2 font-medium">Cajero</th>
                    <th className="px-4 py-2 font-medium">Abierto desde</th>
                    <th className="px-4 py-2 font-medium">Venta en curso</th>
                  </tr>
                </thead>
                <tbody>
                  {turnosAbiertos.map((t) => (
                    <tr key={t.id} className="border-t border-ink/5">
                      <td className="px-4 py-2.5">{t.sede.nombre}</td>
                      <td className="px-4 py-2.5 text-ink/60">
                        {t.usuarioApertura.nombreCompleto}
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        {new Date(t.fechaApertura).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-caramel font-semibold tabular-nums">
                        ${(t.ventaEnCurso ?? 0).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <div className="md:hidden space-y-2.5">
              {turnosAbiertos.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-ink/10 rounded-xl p-3.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {t.sede.nombre}
                      </p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {t.usuarioApertura.nombreCompleto} · desde{" "}
                        {new Date(t.fechaApertura).toLocaleTimeString("es-CO", {
                          hour: "2-digit",

                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-caramel font-semibold text-sm tabular-nums">
                      ${(t.ventaEnCurso ?? 0).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
