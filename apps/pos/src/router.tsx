import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import VentaPage from "./pages/VentaPage";
import InicioPage from "./pages/InicioPage";
import CerrarTurnoPage from "./pages/CerrarTurnoPage";
import UsuariosPage from "./pages/usuariosPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import RutaProtegida from "./components/RutaProtegida";
import RutaConRol from "./components/layout/RutaConRol";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <RutaProtegida />,
    children: [
      { path: "/cerrar-turno", element: <CerrarTurnoPage /> },
      {
        element: <RutaConRol seccion="inicio" />,
        children: [{ path: "/inicio", element: <InicioPage /> }],
      },
      {
        element: <RutaConRol seccion="venta" />,
        children: [{ path: "/venta", element: <VentaPage /> }],
      },
      {
        element: <RutaConRol seccion="inventario" />,
        children: [
          {
            path: "/inventario",
            element: <PlaceholderPage titulo="Inventario" />,
          },
        ],
      },
      {
        element: <RutaConRol seccion="produccion" />,
        children: [
          {
            path: "/produccion",
            element: <PlaceholderPage titulo="Producción" />,
          },
        ],
      },
      {
        element: <RutaConRol seccion="reportes" />,
        children: [
          { path: "/reportes", element: <PlaceholderPage titulo="Reportes" /> },
        ],
      },
      {
        element: <RutaConRol seccion="usuarios" />,
        children: [{ path: "/usuarios", element: <UsuariosPage /> }],
      },
    ],
  },
]);
