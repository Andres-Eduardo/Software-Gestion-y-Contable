import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import VentaPage from "./pages/VentaPage";
import RutaProtegida from "./components/RutaProtegida";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <RutaProtegida />,
    children: [{ path: "/venta", element: <VentaPage /> }],
  },
]);
