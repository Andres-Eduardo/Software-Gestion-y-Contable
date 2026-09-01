import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";

export default async function turnosRoutes(app: FastifyInstance) {
  // Ver el turno abierto actual de mi sede (o de una sede específica si soy ADMIN/GERENTE)
  app.get<{ Querystring: { sedeId?: string } }>(
    "/turnos/actual",
    {
      preHandler: [
        authenticate,
        requireRole("ADMIN", "GERENTE", "CAFETERIA", "CARRITO"),
      ],
    },
    async (request) => {
      const { sedeId: sedeIdUsuario, rol } = (request as any).user;
      const sedeId =
        (rol === "ADMIN" || rol === "GERENTE") && request.query.sedeId
          ? request.query.sedeId
          : sedeIdUsuario;

      if (!sedeId) {
        return { error: "No se especificó una sede" };
      }

      return prisma.turno.findFirst({
        where: { sedeId, estado: "ABIERTO" },
      });
    },
  );

  // Historial de turnos
  app.get(
    "/turnos",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request: any) => {
      const { empresaId } = request.user;

      return prisma.turno.findMany({
        where: { sede: { empresaId } },
        orderBy: { fechaApertura: "desc" },
        include: {
          sede: { select: { id: true, nombre: true, tipo: true } },
          usuarioApertura: {
            select: { id: true, nombreCompleto: true, rol: true },
          },
          usuarioCierre: {
            select: { id: true, nombreCompleto: true, rol: true },
          },
        },
      });
    },
  );

  // Apertura de turno
  app.post<{ Body: { efectivoInicial: number; sedeId?: string } }>(
    "/turnos/apertura",
    {
      preHandler: [
        authenticate,
        requireRole("ADMIN", "GERENTE", "CAFETERIA", "CARRITO"),
      ],
    },
    async (request, reply) => {
      const {
        sub: usuarioId,
        sedeId: sedeIdUsuario,
        rol,
      } = (request as any).user;
      const { efectivoInicial, sedeId: sedeIdBody } = request.body;

      const sedeId =
        (rol === "ADMIN" || rol === "GERENTE") && sedeIdBody
          ? sedeIdBody
          : sedeIdUsuario;

      if (!sedeId) {
        return reply.code(400).send({ error: "No se pudo determinar la sede" });
      }

      const turnoAbierto = await prisma.turno.findFirst({
        where: { sedeId, estado: "ABIERTO" },
      });

      if (turnoAbierto) {
        return reply.code(409).send({
          error: "Ya existe un turno abierto en esta sede",
          turnoId: turnoAbierto.id,
        });
      }

      return prisma.turno.create({
        data: {
          sedeId,
          usuarioAperturaId: usuarioId,
          efectivoInicial,
          estado: "ABIERTO",
        },
      });
    },
  );

  // Cierre de turno (cierre ciego)
  app.post<{
    Params: { id: string };
    Body: { efectivoDeclaradoCierre: number; observaciones?: string };
  }>(
    "/turnos/:id/cerrar",
    {
      preHandler: [
        authenticate,
        requireRole("ADMIN", "GERENTE", "CAFETERIA", "CARRITO"),
      ],
    },
    async (request, reply) => {
      const { sub: usuarioId } = (request as any).user;
      const { id } = request.params;
      const { efectivoDeclaradoCierre, observaciones } = request.body;

      const turno = await prisma.turno.findFirst({ where: { id } });

      if (!turno) {
        return reply.code(404).send({ error: "Turno no encontrado" });
      }

      if (turno.estado === "CERRADO") {
        return reply.code(409).send({ error: "Este turno ya está cerrado" });
      }

      // A partir de aquí, efectivoDeclaradoCierre ya quedó fijado — el cálculo
      // del teórico ocurre después, en el mismo paso, nunca antes.

      const pagosEfectivo = await prisma.pagoFactura.aggregate({
        where: { medioPago: "EFECTIVO", factura: { turnoId: id } },
        _sum: { monto: true },
      });

      const gastosCajaMenor = await prisma.cajaMenor.aggregate({
        where: { turnoId: id },
        _sum: { monto: true },
      });

      const totalVentasEfectivo = pagosEfectivo._sum.monto ?? 0;
      const totalGastos = gastosCajaMenor._sum.monto ?? 0;

      const efectivoTeoricoCierre =
        Number(turno.efectivoInicial) +
        Number(totalVentasEfectivo) -
        Number(totalGastos);

      const descuadre = Number(efectivoDeclaradoCierre) - efectivoTeoricoCierre;

      return prisma.turno.update({
        where: { id },
        data: {
          usuarioCierreId: usuarioId,
          fechaCierre: new Date(),
          efectivoDeclaradoCierre,
          efectivoTeoricoCierre,
          descuadre,
          estado: "CERRADO",

          observaciones,
        },
      });
    },
  );
}
