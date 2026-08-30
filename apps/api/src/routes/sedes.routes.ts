import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";

export default async function sedesRoutes(app: FastifyInstance) {
  app.get("/sedes", { preHandler: [authenticate] }, async (request: any) => {
    const { empresaId } = request.user;
    return prisma.sede.findMany({ where: { empresaId } });
  });

  app.post<{
    Body: { nombre: string; tipo: string; ciudad?: string; direccion?: string };
  }>(
    "/sedes",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const { nombre, tipo, ciudad, direccion } = request.body;
      return prisma.sede.create({
        data: { empresaId, nombre, tipo: tipo as any, ciudad, direccion },
      });
    },
  );
}
