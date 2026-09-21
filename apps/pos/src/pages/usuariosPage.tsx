import { useEffect, useState, type FormEvent } from "react";
import { useAuthStore } from "../store/auth.store";
import { useUsuariosStore } from "../store/usuarios.store";
import { useSedesStore } from "../store/sedes.store";
import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";
import { IconPlus } from "../components/icons";

const ROLES = [
  "ADMIN",
  "GERENTE",
  "CAFETERIA",
  "CARRITO",
  "PRODUCCION",
  "DOMICILIARIO",
];

export default function UsuariosPage() {
  const token = useAuthStore((s) => s.token)!;
  const usuarioActual = useAuthStore((s) => s.usuario);
  const {
    usuarios,
    cargando,
    cargarUsuarios,
    crearUsuario,
    actualizarUsuario,
  } = useUsuariosStore();
  const { sedes, cargarSedes } = useSedesStore();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("CAFETERIA");
  const [sedeId, setSedeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarUsuarios(token);
    cargarSedes(token);
  }, [token, cargarUsuarios, cargarSedes]);

  async function handleCrear(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setGuardando(true);
    try {
      await crearUsuario(token, {
        nombreCompleto,
        email,
        password,
        rol,
        sedeId: sedeId || undefined,
      });
      setMostrarForm(false);
      setNombreCompleto("");
      setEmail("");
      setPassword("");
      setSedeId("");
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el usuario");
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(id: string, activo: boolean) {
    await actualizarUsuario(token, id, { activo: !activo });
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />

      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-espresso">
              Usuarios
            </h1>
            <p className="hidden md:block text-ink/60 text-sm mt-1">
              Gestiona quién tiene acceso al sistema.
            </p>
          </div>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            aria-label="Nuevo usuario"
            className="w-9 h-9 md:w-auto md:px-4 rounded-lg bg-caramel text-espresso flex items-center justify-center gap-1.5 text-sm font-semibold hover:brightness-95 transition shrink-0"
          >
            <IconPlus className="md:hidden" />
            <span className="hidden md:inline">
              {mostrarForm ? "Cancelar" : "+ Nuevo usuario"}
            </span>
          </button>
        </div>

        {mostrarForm && (
          <form
            onSubmit={handleCrear}
            className="bg-white border border-ink/10 rounded-xl p-5 mb-6 max-w-lg space-y-3"
          >
            <div>
              <label className="block text-sm text-ink/70 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>

            <div>
              <label className="block text-sm text-ink/70 mb-1">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-ink/70 mb-1">Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-ink/70 mb-1">Sede</label>
                <select
                  value={sedeId}
                  onChange={(e) => setSedeId(e.target.value)}
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-caramel"
                >
                  <option value="">Sin sede</option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-brick text-sm">{error}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="bg-caramel text-espresso font-semibold rounded-lg px-4 py-2 text-sm hover:brightness-95 transition disabled:opacity-50"
            >
              {guardando ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        )}

        {cargando ? (
          <p className="text-ink/50 text-sm">Cargando...</p>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden md:block bg-white border border-ink/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-paper text-ink/60 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Correo</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Sede</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-t border-ink/5">
                      <td className="px-4 py-3">{u.nombreCompleto}</td>
                      <td className="px-4 py-3 text-ink/60">{u.email}</td>
                      <td className="px-4 py-3 text-ink/60">{u.rol}</td>
                      <td className="px-4 py-3 text-ink/60">
                        {u.sede?.nombre ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.activo
                              ? "text-olive bg-olive/10 px-2 py-0.5 rounded-full text-xs"
                              : "text-brick bg-brick/10 px-2 py-0.5 rounded-full text-xs"
                          }
                        >
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== usuarioActual?.sub && (
                          <button
                            onClick={() => handleToggleActivo(u.id, u.activo)}
                            className="text-caramel text-xs font-medium hover:underline"
                          >
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <div className="md:hidden space-y-2.5">
              {usuarios.map((u) => (
                <div
                  key={u.id}
                  className="bg-white border border-ink/10 rounded-xl p-3.5"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {u.nombreCompleto}
                      </p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {u.rol}
                        {u.sede ? ` · ${u.sede.nombre}` : ""}
                      </p>
                    </div>

                    <span
                      className={
                        u.activo
                          ? "text-[10px] font-semibold text-olive bg-olive/10 px-2 py-0.5 rounded-full whitespace-nowrap"
                          : "text-[10px] font-semibold text-brick bg-brick/10 px-2 py-0.5 rounded-full whitespace-nowrap"
                      }
                    >
                      {u.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
                  {u.id !== usuarioActual?.sub && (
                    <button
                      onClick={() => handleToggleActivo(u.id, u.activo)}
                      className="text-caramel text-xs font-semibold"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
