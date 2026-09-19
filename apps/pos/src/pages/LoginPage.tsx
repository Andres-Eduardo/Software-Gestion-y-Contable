import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { rutaInicioPorRol } from "../utils/roles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
      const rol = useAuthStore.getState().usuario?.rol;
      navigate(rutaInicioPorRol(rol));
    } catch (err: any) {
      setError(err.message ?? "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-ink/10 rounded-2xl p-10 w-full max-w-sm flex flex-col items-center"
      >
        <h1 className="font-display text-4xl font-semibold text-espresso mb-1 text-center">
          Opa
        </h1>
        <p className="text-ink/60 text-sm mb-7 text-center">
          Inicia sesión para continuar
        </p>

        <label htmlFor="email" className="self-start text-sm text-ink/70 mb-1">
          Correo
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-ink/15 px-3 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-caramel text-ink"
        />

        <label
          htmlFor="password"
          className="self-start text-sm text-ink/70 mb-1"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-ink/15 px-3 py-2.5 mb-5 outline-none focus:ring-2 focus:ring-caramel text-ink"
        />

        {error && <p className="text-brick text-sm mb-4 self-start">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-caramel hover:brightness-95 disabled:opacity-50 text-espresso font-semibold rounded-lg py-3 transition"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
