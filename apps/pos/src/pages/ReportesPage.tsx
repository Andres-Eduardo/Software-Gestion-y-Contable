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
        <p className="text-ink/50 text-sm p-8">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-6 md:p-8 max-w-4xl space-y-8">
        <div>
          <h1 className="font-display text-3xl text-espresso mb-4">Reportes</h1>

          <div className="bg-white border border-ink/10 rounded-xl overflow-hidden">
            <h2 className="font-display text-xl text-espresso p-5 pb-0">
              Ventas por sede
            </h2>
            {ventas.length === 0 ? (
              <p className="text-ink/50 text-sm p-5">
                Sin ventas registradas todavía.
              </p>
            ) : (
              <table className="w-full text-sm mt-3">
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
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl text-espresso mb-3">
            Descuadres
          </h2>
          <div className="bg-white border border-ink/10 rounded-xl overflow-hidden mb-4">
            <h3 className="text-sm font-medium text-ink/60 p-4 pb-0">
              Turnos (caja)
            </h3>
            {turnosDescuadrados.length === 0 ? (
              <p className="text-ink/50 text-sm p-4">Sin descuadres de caja.</p>
            ) : (
              <table className="w-full text-sm mt-2">
                <tbody>
                  {turnosDescuadrados.map((t) => (
                    <tr key={t.id} className="border-t border-ink/5">
                      <td className="px-4 py-2.5">{t.sede.nombre}</td>
                      <td className="px-4 py-2.5 text-ink/60">
                        {t.usuarioCierre?.nombreCompleto ?? "—"}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-semibold tabular-nums ${
                          Number(t.descuadre) < 0 ? "text-brick" : "text-olive"
                        }`}
                      >
                        ${Math.abs(Number(t.descuadre)).toLocaleString("es-CO")}
                        {Number(t.descuadre) < 0 ? " faltante" : " sobrante"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-ink/10 rounded-xl overflow-hidden">
            <h3 className="text-sm font-medium text-ink/60 p-4 pb-0">
              Vending
            </h3>
            {arqueosDescuadrados.length === 0 ? (
              <p className="text-ink/50 text-sm p-4">
                Sin descuadres de vending.
              </p>
            ) : (
              <table className="w-full text-sm mt-2">
                <tbody>
                  {arqueosDescuadrados.map((a) => (
                    <tr key={a.id} className="border-t border-ink/5">
                      <td className="px-4 py-2.5">
                        {a.auditoria.maquina.nombre ??
                          a.auditoria.maquina.codigo}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-semibold tabular-nums ${
                          Number(a.descuadre) < 0 ? "text-brick" : "text-olive"
                        }`}
                      >
                        ${Math.abs(Number(a.descuadre)).toLocaleString("es-CO")}
                        {Number(a.descuadre) < 0 ? " faltante" : " sobrante"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl text-espresso mb-3">
            Cuentas vencidas
          </h2>
          <div className="bg-white border border-ink/10 rounded-xl overflow-hidden mb-4">
            <h3 className="text-sm font-medium text-ink/60 p-4 pb-0">
              Por cobrar
            </h3>
            {cuentasPorCobrarVencidas.length === 0 ? (
              <p className="text-ink/50 text-sm p-4">
                Sin cuentas por cobrar vencidas.
              </p>
            ) : (
              <table className="w-full text-sm mt-2">
                <tbody>
                  {cuentasPorCobrarVencidas.map((c) => (
                    <tr key={c.id} className="border-t border-ink/5">
                      <td className="px-4 py-2.5">
                        {c.tercero.nombreCompleto}
                      </td>
                      <td className="px-4 py-2.5 text-brick font-semibold tabular-nums">
                        ${Number(c.saldoPendiente).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-ink/10 rounded-xl overflow-hidden">
            <h3 className="text-sm font-medium text-ink/60 p-4 pb-0">
              Por pagar
            </h3>
            {cuentasPorPagarVencidas.length === 0 ? (
              <p className="text-ink/50 text-sm p-4">
                Sin cuentas por pagar vencidas.
              </p>
            ) : (
              <table className="w-full text-sm mt-2">
                <tbody>
                  {cuentasPorPagarVencidas.map((c) => (
                    <tr key={c.id} className="border-t border-ink/5">
                      <td className="px-4 py-2.5">
                        {c.tercero.nombreCompleto}
                      </td>
                      <td className="px-4 py-2.5 text-brick font-semibold tabular-nums">
                        ${Number(c.saldoPendiente).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
