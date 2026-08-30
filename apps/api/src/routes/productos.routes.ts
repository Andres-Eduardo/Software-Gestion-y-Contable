import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";

export default async function productosRoutes(app: FastifyInstance) {
  app.get(
    "/productos",
    { preHandler: [authenticate] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.producto.findMany({
        where: { empresaId },
        include: { unidadMedida: true },
      });
    },
  );

  app.post<{
    Body: {
      codigo: string;
      nombre: string;
      descripcion?: string;
      tipo: "INSUMO" | "VENDIBLE_PROPIO" | "VENDIBLE_REVENTA";
      unidadMedidaId: string;
      precioVenta?: number;
      aplicaInc?: boolean;
    };
  }>(
    "/productos",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const body = request.body;
      return prisma.producto.create({
        data: {
          empresaId,

          codigo: body.codigo,
          nombre: body.nombre,
          descripcion: body.descripcion,
          tipo: body.tipo,
          unidadMedidaId: body.unidadMedidaId,
          precioVenta: body.precioVenta,
          aplicaInc: body.aplicaInc ?? false,
        },
      });
    },
  );

  app.get("/unidades-medida", { preHandler: [authenticate] }, async () => {
    return prisma.unidadMedida.findMany();
  });
}
