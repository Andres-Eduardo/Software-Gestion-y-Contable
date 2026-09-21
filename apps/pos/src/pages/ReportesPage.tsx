import { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { useReportesStore } from "../store/reportes.store";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";

export default function ReportesPage() {
  const token = useAuthStore((s) => s.token)!;
  const {
    ventas,
    turnosDescuadrados,
    arqueosDescuadrados,
    cuentasPorCobrarVencidas,
    cuentasPorPagarVencidas,
    cargando,
    cargarTodo,
  } = useReportesStore();

  useEffect(() => {
    cargarTodo(token);
  }, [token]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader />
        <NavTabs />
        <p className="text-ink/50 text-sm p-4 md:p-8">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-4 md:p-8 max-w-4xl space-y-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-espresso mb-4">
            Reportes
          </h1>

          <h2 className="font-display text-lg md:text-xl text-espresso mb-3">
            Ventas por sede
          </h2>
          {ventas.length === 0 ? (
            <p className="text-ink/50 text-sm">
              Sin ventas registradas todavía.
            </p>
          ) : (
            <>
              {/* Escritorio: tabla */}
              <div className="hidden md:block bg-white border border-ink/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-paper text-ink/60 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium">Sede</th>
                      <th className="px-4 py-2 font-medium">Facturas</th>
                      <th className="px-4 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v) => (
                      <tr key={v.sedeId} className="border-t border-ink/5">
                        <td className="px-4 py-2.5">{v.sedeNombre}</td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {v.cantidadFacturas}
                        </td>
                        <td className="px-4 py-2.5 text-caramel font-semibold tabular-nums">
                          ${v.total.toLocaleString("es-CO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Móvil: tarjetas */}
              <div className="md:hidden space-y-2.5">
                {ventas.map((v) => (
                  <div
                    key={v.sedeId}
                    className="bg-white border border-ink/10 rounded-xl p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm text-ink">{v.sedeNombre}</p>
                      <p className="text-xs text-ink/45 mt-0.5">
                        {v.cantidadFacturas} facturas
                      </p>
                    </div>
                    <span className="text-caramel font-semibold text-sm tabular-nums">
                      ${v.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl md:text-2xl text-espresso mb-3">
            Descuadres
          </h2>

          <p className="text-sm font-medium text-ink/60 mb-2">Turnos (caja)</p>
          {turnosDescuadrados.length === 0 ? (
            <p className="text-ink/50 text-sm mb-4">Sin descuadres de caja.</p>
          ) : (
            <div className="space-y-2.5 mb-4">
              {turnosDescuadrados.map((t) => {
                const monto = Number(t.descuadre);
                return (
                  <div
                    key={t.id}
                    className="bg-white border border-ink/10 rounded-xl p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm text-ink">{t.sede.nombre}</p>
                      <p className="text-xs text-ink/45 mt-0.5">
                        {t.usuarioCierre?.nombreCompleto ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        monto < 0 ? "text-brick" : "text-olive"
                      }`}
                    >
                      ${Math.abs(monto).toLocaleString("es-CO")}{" "}
                      {monto < 0 ? "faltante" : "sobrante"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-sm font-medium text-ink/60 mb-2">Vending</p>
          {arqueosDescuadrados.length === 0 ? (
            <p className="text-ink/50 text-sm">Sin descuadres de vending.</p>
          ) : (
            <div className="space-y-2.5">
              {arqueosDescuadrados.map((a) => {
                const monto = Number(a.descuadre);
                return (
                  <div
                    key={a.id}
                    className="bg-white border border-ink/10 rounded-xl p-3 flex justify-between items-center"
                  >
                    <span className="text-sm text-ink">
                      {a.auditoria.maquina.nombre ?? a.auditoria.maquina.codigo}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        monto < 0 ? "text-brick" : "text-olive"
                      }`}
                    >
                      ${Math.abs(monto).toLocaleString("es-CO")}{" "}
                      {monto < 0 ? "faltante" : "sobrante"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl md:text-2xl text-espresso mb-3">
            Cuentas vencidas
          </h2>

          <p className="text-sm font-medium text-ink/60 mb-2">Por cobrar</p>
          {cuentasPorCobrarVencidas.length === 0 ? (
            <p className="text-ink/50 text-sm mb-4">
              Sin cuentas por cobrar vencidas.
            </p>
          ) : (
            <div className="space-y-2.5 mb-4">
              {cuentasPorCobrarVencidas.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-ink/10 rounded-xl p-3 flex justify-between items-center"
                >
                  <span className="text-sm text-ink">
                    {c.tercero.nombreCompleto}
                  </span>
                  <span className="text-brick font-semibold text-sm tabular-nums">
                    ${Number(c.saldoPendiente).toLocaleString("es-CO")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm font-medium text-ink/60 mb-2">Por pagar</p>
          {cuentasPorPagarVencidas.length === 0 ? (
            <p className="text-ink/50 text-sm">
              Sin cuentas por pagar vencidas.
            </p>
          ) : (
            <div className="space-y-2.5">
              {cuentasPorPagarVencidas.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-ink/10 rounded-xl p-3 flex justify-between items-center"
                >
                  <span className="text-sm text-ink">
                    {c.tercero.nombreCompleto}
                  </span>
                  <span className="text-brick font-semibold text-sm tabular-nums">
                    ${Number(c.saldoPendiente).toLocaleString("es-CO")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
