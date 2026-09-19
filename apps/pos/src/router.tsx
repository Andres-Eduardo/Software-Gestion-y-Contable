import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import VentaPage from "./pages/VentaPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import RutaProtegida from "./components/RutaProtegida";
import InicioPage from "./pages/InicioPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <RutaProtegida />,
    children: [
      { path: "/venta", element: <VentaPage /> },
      { path: "/inventario", element: <PlaceholderPage titulo="Inventario" /> },
      { path: "/produccion", element: <PlaceholderPage titulo="Producción" /> },
      { path: "/reportes", element: <PlaceholderPage titulo="Reportes" /> },
      { path: "/usuarios", element: <PlaceholderPage titulo="Usuarios" /> },
      { path: "/inicio", element: <InicioPage /> },
    ],
  },
]);
