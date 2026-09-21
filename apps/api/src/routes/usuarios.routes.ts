import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";

export default async function usuariosRoutes(app: FastifyInstance) {
  app.get(
    "/usuarios",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.usuario.findMany({
        where: { empresaId },
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
          documento: true,
          rol: true,
          sedeId: true,
          activo: true,
          createdAt: true,
          sede: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    },
  );

  app.post<{
    Body: {
      nombreCompleto: string;

      email: string;
      password: string;
      rol: string;
      sedeId?: string;
    };
  }>(
    "/usuarios",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const { empresaId } = (request as any).user;
      const { nombreCompleto, email, password, rol, sedeId } = request.body;

      if (!nombreCompleto || !email || !password || !rol) {
        return reply.code(400).send({ error: "Faltan campos obligatorios" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      try {
        const usuario = await prisma.usuario.create({
          data: {
            empresaId,
            nombreCompleto,
            email,
            passwordHash,
            rol: rol as any,
            sedeId,
          },
          select: {
            id: true,
            nombreCompleto: true,
            email: true,

            rol: true,
            sedeId: true,
            activo: true,
            sede: { select: { id: true, nombre: true } },
          },
        });
        return usuario;
      } catch (err: any) {
        if (err.code === "P2002") {
          return reply
            .code(409)
            .send({ error: "Ya existe un usuario con ese correo" });
        }
        throw err;
      }
    },
  );

  app.patch<{
    Params: { id: string };
    Body: {
      nombreCompleto?: string;
      rol?: string;
      sedeId?: string | null;
      activo?: boolean;
    };
  }>(
    "/usuarios/:id",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const { empresaId } = (request as any).user;
      const { id } = request.params;

      const existente = await prisma.usuario.findFirst({
        where: { id, empresaId },
      });
      if (!existente)
        return reply.code(404).send({ error: "Usuario no encontrado" });

      const { sub: usuarioActualId } = (request as any).user;

      if (request.body.activo === false) {
        if (id === usuarioActualId) {
          return reply
            .code(400)
            .send({ error: "No puedes desactivar tu propia cuenta" });
        }
        if (existente.rol === "ADMIN") {
          const adminsActivos = await prisma.usuario.count({
            where: { empresaId, rol: "ADMIN", activo: true },
          });
          if (adminsActivos <= 1) {
            return reply
              .code(400)
              .send({
                error: "No puedes desactivar el único administrador activo",
              });
          }
        }
      }

      const usuario = await prisma.usuario.update({
        where: { id },
        data: request.body as any,
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
          rol: true,
          sedeId: true,
          activo: true,
          sede: { select: { id: true, nombre: true } },
        },
      });

      return usuario;
    },
  );
}
