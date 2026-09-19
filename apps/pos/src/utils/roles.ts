import { ICONO_SECCION as ICONOS } from "../components/icons";

export type Seccion =
  | "inicio"
  | "venta"
  | "inventario"
  | "produccion"
  | "reportes"
  | "usuarios";

const SECCIONES_POR_ROL: Record<string, Seccion[]> = {
  ADMIN: ["inicio", "inventario", "produccion", "reportes", "usuarios"],
  GERENTE: ["inicio", "inventario", "produccion", "reportes", "usuarios"],
  CAFETERIA: ["venta", "inventario"],
  CARRITO: ["venta", "inventario"],
  DOMICILIARIO: ["inventario"],
  PRODUCCION: ["produccion"],
};

export function seccionesVisibles(rol: string | undefined): Seccion[] {
  return SECCIONES_POR_ROL[rol ?? ""] ?? [];
}

export function rutaInicioPorRol(rol: string | undefined): string {
  const secciones = seccionesVisibles(rol);
  return secciones.length > 0 ? RUTA_SECCION[secciones[0]] : "/login";
}

export const NOMBRE_SECCION: Record<Seccion, string> = {
  inicio: "Inicio",
  venta: "Venta",
  inventario: "Inventario",

  produccion: "Producción",
  reportes: "Reportes",
  usuarios: "Usuarios",
};

export const RUTA_SECCION: Record<Seccion, string> = {
  inicio: "/inicio",
  venta: "/venta",
  inventario: "/inventario",
  produccion: "/produccion",
  reportes: "/reportes",
  usuarios: "/usuarios",
};

export const ICONO_SECCION = ICONOS;
