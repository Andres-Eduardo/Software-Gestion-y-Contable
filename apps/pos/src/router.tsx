import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import VentaPage from "./pages/VentaPage";
import InicioPage from "./pages/InicioPage";
import CerrarTurnoPage from "./pages/CerrarTurnoPage";
import UsuariosPage from "./pages/usuariosPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import InventarioPage from "./pages/inventarioPage";
import ProduccionPage from "./pages/produccionPage";
import ReportesPage from "./pages/ReportesPage";
import RutaProtegida from "./components/RutaProtegida";
import RutaConRol from "./components/layout/RutaConRol";
import MermasPage from "./pages/MermasPage";

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
        children: [{ path: "/inventario", element: <InventarioPage /> }],
      },
      {
        element: <RutaConRol seccion="produccion" />,
        children: [{ path: "/produccion", element: <ProduccionPage /> }],
      },
      {
        element: <RutaConRol seccion="reportes" />,
        children: [{ path: "/reportes", element: <ReportesPage /> }],
      },
      {
        element: <RutaConRol seccion="usuarios" />,
        children: [{ path: "/usuarios", element: <UsuariosPage /> }],
      },
      { path: "/mermas", element: <MermasPage /> },
    ],
  },
]);
