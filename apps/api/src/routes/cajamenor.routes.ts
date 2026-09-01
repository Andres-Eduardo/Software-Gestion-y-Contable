import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate } from "../middleware/auth.js";

export default async function cajaMenorRoutes(app: FastifyInstance) {
  app.post<{
    Body: {
      concepto: string;
      monto: number;
      soporteUrl?: string;
      sedeId?: string;
    };
  }>("/caja-menor", { preHandler: [authenticate] }, async (request, reply) => {
    const {
      sub: usuarioId,
      empresaId,
      sedeId: sedeIdUsuario,
      rol,
    } = (request as any).user;
    const { concepto, monto, soporteUrl, sedeId: sedeIdBody } = request.body;

    if (!concepto || !monto) {
      return reply
        .code(400)
        .send({ error: "Concepto y monto son obligatorios" });
    }

    const sedeId =
      (rol === "ADMIN" || rol === "GERENTE") && sedeIdBody
        ? sedeIdBody
        : sedeIdUsuario;

    if (!sedeId) {
      return reply.code(400).send({ error: "No se pudo determinar la sede" });
    }

    const turno = await prisma.turno.findFirst({
      where: { sedeId, estado: "ABIERTO" },
    });

    return prisma.cajaMenor.create({
      data: {
        empresaId,
        sedeId,
        turnoId: turno?.id,
        usuarioId,
        concepto,
        monto,

        soporteUrl,
      },
    });
  });

  app.get(
    "/caja-menor",
    { preHandler: [authenticate] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.cajaMenor.findMany({
        where: { empresaId },
        orderBy: { fecha: "desc" },
        include: {
          sede: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombreCompleto: true, rol: true } },
        },
      });
    },
  );
}
