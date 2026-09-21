import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { seccionesVisibles, type Seccion } from "../../utils/roles";

interface Props {
  seccion: Seccion;
}

export default function RutaConRol({ seccion }: Props) {
  const rol = useAuthStore((s) => s.usuario?.rol);
  const permitido = seccionesVisibles(rol).includes(seccion);

  if (!permitido) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
