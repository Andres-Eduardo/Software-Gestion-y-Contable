import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate } from "../middleware/auth.js";
import { calcularDV } from "../utils/dv.util.js";

export default async function tercerosRoutes(app: FastifyInstance) {
  app.get("/terceros", { preHandler: [authenticate] }, async (request: any) => {
    const { empresaId } = request.user;
    return prisma.tercero.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post<{
    Body: {
      tipoPersona: "NATURAL" | "JURIDICA";
      tipoDocumento: "CC" | "NIT" | "CE" | "PASAPORTE";
      numeroDocumento: string;
      nombreCompleto: string;
      nombreComercial?: string;
      email?: string;
      telefono?: string;
      direccion?: string;
      ciudad?: string;
      esCliente?: boolean;
      esProveedor?: boolean;
    };
  }>("/terceros", { preHandler: [authenticate] }, async (request) => {
    const { empresaId } = (request as any).user;
    const body = request.body;

    const dv =
      body.tipoDocumento === "NIT" ? calcularDV(body.numeroDocumento) : null;

    return prisma.tercero.create({
      data: {
        empresaId,
        tipoPersona: body.tipoPersona,
        tipoDocumento: body.tipoDocumento,
        numeroDocumento: body.numeroDocumento,
        dv,
        nombreCompleto: body.nombreCompleto,
        nombreComercial: body.nombreComercial,
        email: body.email,
        telefono: body.telefono,
        direccion: body.direccion,
        ciudad: body.ciudad,
        esCliente: body.esCliente ?? true,
        esProveedor: body.esProveedor ?? false,
      },
    });
  });

  app.get<{ Params: { id: string } }>(
    "/terceros/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { empresaId } = (request as any).user;
      const tercero = await prisma.tercero.findFirst({
        where: { id: request.params.id, empresaId },
      });
      if (!tercero)
        return reply.code(404).send({ error: "Tercero no encontrado" });
      return tercero;
    },
  );
}
