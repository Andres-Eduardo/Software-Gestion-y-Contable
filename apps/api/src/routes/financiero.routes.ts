import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";

function calcularEstado(
  saldoPendiente: number,
  montoOriginal: number,
): "PENDIENTE" | "PARCIAL" | "PAGADA" {
  if (saldoPendiente <= 0) return "PAGADA";
  if (saldoPendiente < montoOriginal) return "PARCIAL";
  return "PENDIENTE";
}

export default async function financieroRoutes(app: FastifyInstance) {
  // Cuentas por Cobrar
  app.get(
    "/cuentas-por-cobrar",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.cuentaPorCobrar.findMany({
        where: { tercero: { empresaId } },
        orderBy: { createdAt: "desc" },
        include: {
          tercero: { select: { id: true, nombreCompleto: true } },
          factura: {
            select: { id: true, prefijo: true, numero: true, total: true },
          },
          pagos: true,
        },
      });
    },
  );

  app.post<{
    Params: { id: string };
    Body: {
      monto: number;
      medioPago: "EFECTIVO" | "NEQUI" | "DATAFONO" | "CREDITO";
      referencia?: string;
    };
  }>(
    "/cuentas-por-cobrar/:id/pagos",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const { sub: usuarioId } = (request as any).user;
      const { id } = request.params;
      const { monto, medioPago, referencia } = request.body;

      const cuenta = await prisma.cuentaPorCobrar.findFirst({ where: { id } });
      if (!cuenta)
        return reply
          .code(404)
          .send({ error: "Cuenta por cobrar no encontrada" });
      if (cuenta.estado === "PAGADA") {
        return reply
          .code(409)
          .send({ error: "Esta cuenta ya está totalmente pagada" });
      }
      if (monto > Number(cuenta.saldoPendiente)) {
        return reply
          .code(400)
          .send({ error: "El abono no puede superar el saldo pendiente" });
      }

      const nuevoSaldo = Number(cuenta.saldoPendiente) - monto;
      const estado = calcularEstado(nuevoSaldo, Number(cuenta.montoOriginal));

      return prisma.$transaction(async (tx) => {
        await tx.pagoCuentaPorCobrar.create({
          data: {
            cuentaPorCobrarId: id,
            monto,
            medioPago,
            referencia,
            usuarioRegistraId: usuarioId,
          },
        });
        return tx.cuentaPorCobrar.update({
          where: { id },
          data: { saldoPendiente: nuevoSaldo, estado },
        });
      });
    },
  );

  // Cuentas por Pagar
  app.post<{
    Body: {
      terceroId: string;
      concepto: string;
      montoOriginal: number;
      fechaVencimiento?: string;
    };
  }>(
    "/cuentas-por-pagar",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const { terceroId, concepto, montoOriginal, fechaVencimiento } =
        request.body;
      return prisma.cuentaPorPagar.create({
        data: {
          empresaId,
          terceroId,
          concepto,
          montoOriginal,
          saldoPendiente: montoOriginal,
          fechaVencimiento: fechaVencimiento
            ? new Date(fechaVencimiento)
            : undefined,
          estado: "PENDIENTE",
        },
      });
    },
  );

  app.get(
    "/cuentas-por-pagar",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.cuentaPorPagar.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        include: {
          tercero: { select: { id: true, nombreCompleto: true } },
          pagos: true,
        },
      });
    },
  );

  app.post<{
    Params: { id: string };
    Body: {
      monto: number;
      medioPago: "EFECTIVO" | "NEQUI" | "DATAFONO" | "CREDITO";
      referencia?: string;
    };
  }>(
    "/cuentas-por-pagar/:id/pagos",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const { sub: usuarioId } = (request as any).user;
      const { id } = request.params;
      const { monto, medioPago, referencia } = request.body;

      const cuenta = await prisma.cuentaPorPagar.findFirst({ where: { id } });
      if (!cuenta)
        return reply
          .code(404)
          .send({ error: "Cuenta por pagar no encontrada" });
      if (cuenta.estado === "PAGADA") {
        return reply
          .code(409)
          .send({ error: "Esta cuenta ya está totalmente pagada" });
      }
      if (monto > Number(cuenta.saldoPendiente)) {
        return reply
          .code(400)
          .send({ error: "El pago no puede superar el saldo pendiente" });
      }

      const nuevoSaldo = Number(cuenta.saldoPendiente) - monto;
      const estado = calcularEstado(nuevoSaldo, Number(cuenta.montoOriginal));

      return prisma.$transaction(async (tx) => {
        await tx.pagoCuentaPorPagar.create({
          data: {
            cuentaPorPagarId: id,
            monto,
            medioPago,
            referencia,
            usuarioRegistraId: usuarioId,
          },
        });
        return tx.cuentaPorPagar.update({
          where: { id },
          data: { saldoPendiente: nuevoSaldo, estado },
        });
      });
    },
  );
}
