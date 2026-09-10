import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import fs from "node:fs/promises";
import { Worker } from "bullmq";
import { prisma } from "db";
import {
  NOMBRE_COLA_FACTURACION_DIAN,
  redisConnection,
  mapearFacturaAPayloadCanonico,
  generarXmlUBL,
  calcularCufeDesdePayload,
  FirmadorMock,
  MockDianAdapter,
} from "dian-connector";

const firmador = new FirmadorMock();
const dianAdapter = new MockDianAdapter();

const worker = new Worker(
  NOMBRE_COLA_FACTURACION_DIAN,
  async (job) => {
    const { facturaId } = job.data as { facturaId: string };
    console.log(
      `[worker-dian] Procesando factura ${facturaId} (intento ${job.attemptsMade + 1})`,
    );

    const factura = await prisma.factura.findFirst({
      where: { id: facturaId },
      include: {
        empresa: true,
        tercero: true,
        pagos: true,
        detalles: {
          include: { producto: { include: { unidadMedida: true } } },
        },
      },
    });

    if (!factura) throw new Error(`Factura ${facturaId} no encontrada`);

    await prisma.factura.update({
      where: { id: facturaId },
      data: { estadoDian: "EN_PROCESO" },
    });

    const payload = mapearFacturaAPayloadCanonico(factura as any);
    const xmlSinFirmar = generarXmlUBL(payload);
    const cufe = calcularCufeDesdePayload(
      payload,
      process.env.DIAN_CLAVE_TECNICA as string,
      process.env.DIAN_TIPO_AMBIENTE as string,
    );
    const { xmlFirmado } = await firmador.firmar(xmlSinFirmar);

    const respuesta = await dianAdapter.enviarDocumento(xmlFirmado, cufe);

    if (!respuesta.aceptado) {
      throw new Error(`DIAN rechazó el documento: ${respuesta.mensaje}`);
    }

    const carpetaStorage = path.resolve(__dirname, "../../../storage/dian-xml");
    await fs.mkdir(carpetaStorage, { recursive: true });
    const xmlPath = path.join(carpetaStorage, `${facturaId}.xml`);
    await fs.writeFile(xmlPath, xmlFirmado, "utf-8");

    await prisma.factura.update({
      where: { id: facturaId },
      data: { estadoDian: "ACEPTADO", cufe: respuesta.cufe, xmlPath },
    });

    return respuesta;
  },
  { connection: redisConnection, concurrency: 3 },
);

worker.on("failed", async (job, err) => {
  if (!job) return;
  const agotoIntentos = job.attemptsMade >= (job.opts.attempts ?? 1);
  console.log(
    `[worker-dian] Job de factura ${job.data.facturaId} falló (intento ${job.attemptsMade}): ${err.message}`,
  );

  if (agotoIntentos) {
    await prisma.factura
      .update({
        where: { id: job.data.facturaId },
        data: { estadoDian: "RECHAZADO", observaciones: err.message },
      })
      .catch(() => {});
    console.log(
      `[worker-dian] Factura ${job.data.facturaId} marcada como RECHAZADO tras agotar reintentos`,
    );
  }
});

worker.on("completed", (job) => {
  console.log(
    `[worker-dian] Factura ${job.data.facturaId} ACEPTADA por la DIAN (simulado)`,
  );
});

console.log("Worker DIAN escuchando la cola...");
