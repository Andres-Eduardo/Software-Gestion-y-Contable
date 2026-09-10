import { Queue } from "bullmq";
import IORedis from "ioredis";

// BullMQ exige explícitamente maxRetriesPerRequest: null en la conexión que se le pasa
// a un Worker (usa comandos bloqueantes de Redis) — omitir esto causa errores difíciles
// de diagnosticar más adelante.
const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

export const NOMBRE_COLA_FACTURACION_DIAN = "facturacion-dian";

export const facturaQueue = new Queue(NOMBRE_COLA_FACTURACION_DIAN, {
  connection,
});

export async function encolarProcesoFactura(facturaId: string): Promise<void> {
  await facturaQueue.add(
    "procesar-factura",
    { facturaId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

export { connection as redisConnection };
