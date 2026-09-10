import { createHash } from "node:crypto";
import type { PayloadCanonico } from "../types/payload-canonico.js";

// Algoritmo de cálculo del CUFE conforme al Anexo Técnico 1.9 (SHA-384).
// PENDIENTE: validar el orden exacto de concatenación y el manejo de NumAdq contra la
// documentación vigente una vez se tenga acceso al ambiente de habilitación real — hay
// variantes documentadas públicamente que difieren en detalles menores.

interface DatosCufe {
  numFac: string;
  fecFac: string;
  horFac: string;
  valFac: number;
  valIva: number;
  valInc: number;
  valIca: number;
  valTot: number;
  nitFac: string;
  nitAdq: string;
  claveTecnica: string;
  tipoAmbiente: string;
}

function construirCadenaCufe(datos: DatosCufe): string {
  return [
    datos.numFac,
    datos.fecFac,
    datos.horFac,
    datos.valFac.toFixed(2),
    "01",
    datos.valIva.toFixed(2),
    "04",
    datos.valInc.toFixed(2),
    "03",
    datos.valIca.toFixed(2),
    datos.valTot.toFixed(2),
    datos.nitFac,
    datos.nitAdq,
    "0",
    datos.claveTecnica,
    datos.tipoAmbiente,
  ].join("");
}

export function calcularCufeDesdePayload(
  payload: PayloadCanonico,
  claveTecnica: string,
  tipoAmbiente: string,
): string {
  const [horaSola] = [payload.documento.horaEmision];
  const horFac = `${horaSola}-05:00`;

  const datos: DatosCufe = {
    numFac: `${payload.documento.prefijo}${payload.documento.numero}`,
    fecFac: payload.documento.fechaEmision,
    horFac,
    valFac: payload.totales.subtotal,
    valIva: payload.totales.totalIva,
    valInc: payload.totales.totalInc,
    valIca: 0,
    valTot: payload.totales.total,
    nitFac: payload.emisor.nit,
    nitAdq: payload.adquirente.numeroDocumento,
    claveTecnica,
    tipoAmbiente,
  };

  const cadena = construirCadenaCufe(datos);
  return createHash("sha384").update(cadena).digest("hex");
}
