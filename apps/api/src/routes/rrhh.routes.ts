import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";
import { calcularSaldoPendiente } from "../utils/cuentaCorriente.util.js";

const DEDUCCION_LEY_PORCENTAJE = 8;

export default async function rrhhRoutes(app: FastifyInstance) {
  // Empleados
  app.post<{
    Body: {
      nombreCompleto: string;
      documento: string;
      fechaIngreso: string;
      salarioBase: number;
      tipoContrato:
        | "TERMINO_FIJO"
        | "TERMINO_INDEFINIDO"
        | "PRESTACION_SERVICIOS"
        | "APRENDIZ";
      usuarioId?: string;
    };
  }>(
    "/empleados",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const body = request.body;
      return prisma.empleado.create({
        data: {
          empresaId,
          nombreCompleto: body.nombreCompleto,
          documento: body.documento,
          fechaIngreso: new Date(body.fechaIngreso),
          salarioBase: body.salarioBase,
          tipoContrato: body.tipoContrato,
          usuarioId: body.usuarioId,
        },
      });
    },
  );

  app.get(
    "/empleados",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.empleado.findMany({ where: { empresaId } });
    },
  );

  // Cuenta Corriente
  app.post<{
    Params: { id: string };
    Body: {
      tipo: "ANTICIPO" | "PRESTAMO" | "CONSUMO_INTERNO" | "ABONO";
      monto: number;
      descripcion?: string;
    };
  }>(
    "/empleados/:id/cuenta-corriente",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const { sub: usuarioId } = (request as any).user;
      const { id: empleadoId } = request.params;
      const { tipo, monto, descripcion } = request.body;

      const empleado = await prisma.empleado.findFirst({
        where: { id: empleadoId },
      });
      if (!empleado)
        return reply.code(404).send({ error: "Empleado no encontrado" });

      return prisma.cuentaCorrienteEmpleado.create({
        data: {
          empleadoId,
          tipo,
          monto,
          descripcion,
          usuarioRegistraId: usuarioId,
        },
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    "/empleados/:id/cuenta-corriente",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const movimientos = await prisma.cuentaCorrienteEmpleado.findMany({
        where: { empleadoId: request.params.id },
        orderBy: { fecha: "desc" },
      });
      const saldoPendiente = await calcularSaldoPendiente(request.params.id);
      return { saldoPendiente, movimientos };
    },
  );

  // Nómina
  app.post<{ Body: { periodoInicio: string; periodoFin: string } }>(
    "/nominas",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const { periodoInicio, periodoFin } = request.body;
      return prisma.nomina.create({
        data: {
          empresaId,
          periodoInicio: new Date(periodoInicio),
          periodoFin: new Date(periodoFin),
          estado: "BORRADOR",
        },
      });
    },
  );

  app.get(
    "/nominas",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.nomina.findMany({
        where: { empresaId },
        orderBy: { periodoInicio: "desc" },
        include: {
          detalles: {
            include: {
              empleado: { select: { id: true, nombreCompleto: true } },
            },
          },
        },
      });
    },
  );

  // Generar liquidación de todos los empleados activos, descontando saldo pendiente automáticamente
  app.post<{ Params: { id: string } }>(
    "/nominas/:id/generar",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const { id: nominaId } = request.params;

      const nomina = await prisma.nomina.findFirst({
        where: { id: nominaId, empresaId },
      });
      if (!nomina)
        return reply.code(404).send({ error: "Nómina no encontrada" });
      if (nomina.estado !== "BORRADOR") {
        return reply
          .code(409)
          .send({ error: "Esta nómina ya no está en estado BORRADOR" });
      }

      const empleados = await prisma.empleado.findMany({
        where: { empresaId, activo: true },
      });

      const resultados = [];

      for (const empleado of empleados) {
        const yaExiste = await prisma.nominaDetalle.findFirst({
          where: { nominaId, empleadoId: empleado.id },
        });
        if (yaExiste) continue;

        const salarioBase = Number(empleado.salarioBase);
        const totalDevengado = salarioBase;
        const deduccionLey = (salarioBase * DEDUCCION_LEY_PORCENTAJE) / 100;
        const saldoPendiente = await calcularSaldoPendiente(empleado.id);
        const saldoADescontar = Math.min(
          saldoPendiente,
          totalDevengado - deduccionLey,
        );
        const totalDeducciones = deduccionLey + saldoADescontar;
        const totalNeto = totalDevengado - totalDeducciones;

        const detalle = await prisma.$transaction(async (tx) => {
          const nuevoDetalle = await tx.nominaDetalle.create({
            data: {
              nominaId,
              empleadoId: empleado.id,
              salarioBase,
              totalDevengado,
              totalDeducciones,
              saldoCuentaCorrienteDescontado: saldoADescontar,
              totalNeto,
            },
          });

          if (saldoADescontar > 0) {
            await tx.cuentaCorrienteEmpleado.create({
              data: {
                empleadoId: empleado.id,
                tipo: "ABONO",
                monto: saldoADescontar,
                descripcion: `Descuento automático - Nómina ${nominaId}`,
                usuarioRegistraId: usuarioId,
              },
            });
          }

          return nuevoDetalle;
        });

        resultados.push(detalle);
      }

      return {
        nominaId,
        empleadosLiquidados: resultados.length,
        detalles: resultados,
      };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/nominas/:id/aprobar",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const nomina = await prisma.nomina.findFirst({
        where: { id: request.params.id },
      });
      if (!nomina)
        return reply.code(404).send({ error: "Nómina no encontrada" });
      return prisma.nomina.update({
        where: { id: request.params.id },
        data: { estado: "APROBADA" },
      });
    },
  );
}
