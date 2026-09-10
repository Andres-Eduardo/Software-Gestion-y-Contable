import { randomUUID } from "node:crypto";
import type {
  IDianAdapter,
  RespuestaEnvioDian,
} from "./dian-adapter.interface.js";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Adaptador SIMULADO — no se comunica con los servidores reales de la DIAN.
// Se usa mientras no exista el certificado + TestSetId reales. Simula latencia de red
// y un 10% de rechazos aleatorios, para poder construir y probar el manejo de reintentos
// y errores del pipeline completo. Cuando llegue el TestSetId real, se reemplaza por
// DianAdapterReal (cliente SOAP con WS-Security) implementando la misma interfaz.
export class MockDianAdapter implements IDianAdapter {
  async enviarDocumento(
    xmlFirmado: string,
    cufe: string,
  ): Promise<RespuestaEnvioDian> {
    await esperar(300 + Math.random() * 700);

    if (Math.random() < 0.1) {
      return {
        aceptado: false,
        mensaje: "Rechazado (simulado): validación de esquema fallida",
        trackId: randomUUID(),
      };
    }

    return {
      aceptado: true,
      cufe,
      mensaje: "Documento aceptado (simulado)",
      trackId: randomUUID(),
    };
  }

  async consultarEstado(trackId: string): Promise<RespuestaEnvioDian> {
    await esperar(200);
    return { aceptado: true, mensaje: "ACEPTADO (simulado)", trackId };
  }
}
