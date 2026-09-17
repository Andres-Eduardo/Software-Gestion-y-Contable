import { useAuthStore } from "../store/auth.store";

export default function VentaPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-emerald-400">Opa POS — Venta</h1>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
      <p className="text-slate-300">
        Sesión activa — Rol:{" "}
        <span className="text-emerald-400">{usuario?.rol}</span>
      </p>
      <p className="text-slate-500 text-sm mt-2">
        Aquí construiremos la pantalla real de venta en el siguiente paso.
      </p>
    </div>
  );
}
