import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";
import { calcularStock } from "../utils/inventario.util.js";

export default async function inventarioRoutes(app: FastifyInstance) {
  // Consultar stock de un producto en una sede
  app.get<{ Querystring: { sedeId: string; productoId: string } }>(
    "/inventario/stock",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sedeId, productoId } = request.query;
      if (!sedeId || !productoId) {
        return reply
          .code(400)
          .send({ error: "sedeId y productoId son obligatorios" });
      }
      const stock = await calcularStock(sedeId, productoId);
      return { sedeId, productoId, stock };
    },
  );

  // Historial de movimientos
  app.get(
    "/movimientos-inventario",
    { preHandler: [authenticate] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.movimientoInventario.findMany({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        include: {
          producto: { select: { id: true, nombre: true, codigo: true } },
          bodegaOrigen: { select: { id: true, nombre: true } },
          bodegaDestino: { select: { id: true, nombre: true } },
        },
      });
    },
  );

  // Registrar entrada directa (ej. compra a proveedor) — confirmada de inmediato
  app.post<{
    Body: {
      productoId: string;
      bodegaDestinoId: string;
      cantidad: number;
      observaciones?: string;
    };
  }>(
    "/movimientos-inventario/entrada",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const { productoId, bodegaDestinoId, cantidad, observaciones } =
        request.body;

      return prisma.movimientoInventario.create({
        data: {
          empresaId,
          productoId,
          bodegaDestinoId,
          cantidad,
          tipoMovimiento: "COMPRA_ENTRADA",
          estado: "CONFIRMADO",
          usuarioConfirmaId: usuarioId,
          fechaConfirmacion: new Date(),
          observaciones,
        },
      });
    },
  );

  // Registrar merma — confirmada de inmediato
  app.post<{
    Body: {
      productoId: string;

      bodegaOrigenId: string;
      cantidad: number;
      motivoMermaId: string;
      observaciones?: string;
    };
  }>(
    "/movimientos-inventario/merma",
    { preHandler: [authenticate] },
    async (request) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const {
        productoId,
        bodegaOrigenId,
        cantidad,
        motivoMermaId,
        observaciones,
      } = request.body;

      return prisma.movimientoInventario.create({
        data: {
          empresaId,
          productoId,
          bodegaOrigenId,
          cantidad,
          tipoMovimiento: "MERMA",
          motivoMermaId,
          estado: "CONFIRMADO",
          usuarioConfirmaId: usuarioId,
          fechaConfirmacion: new Date(),
          observaciones,
        },
      });
    },
  );

  // Solicitar traslado entre sedes (paso 1 del flujo de confirmación cruzada)
  app.post<{
    Body: {
      productoId: string;
      bodegaOrigenId: string;
      bodegaDestinoId: string;
      cantidad: number;
      observaciones?: string;
    };
  }>(
    "/movimientos-inventario",
    { preHandler: [authenticate] },
    async (request) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const {
        productoId,
        bodegaOrigenId,
        bodegaDestinoId,
        cantidad,
        observaciones,
      } = request.body;

      return prisma.movimientoInventario.create({
        data: {
          empresaId,
          productoId,
          bodegaOrigenId,
          bodegaDestinoId,
          cantidad,
          tipoMovimiento: "TRASLADO",
          estado: "SOLICITADO",
          usuarioSolicitaId: usuarioId,
          fechaSolicitud: new Date(),
          observaciones,
        },
      });
    },
  );

  // Despachar (paso 2 — el domiciliario/bodega confirma que salió)
  app.post<{ Params: { id: string } }>(
    "/movimientos-inventario/:id/despachar",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub: usuarioId } = (request as any).user;

      const movimiento = await prisma.movimientoInventario.findFirst({
        where: { id: request.params.id },
      });

      if (!movimiento)
        return reply.code(404).send({ error: "Movimiento no encontrado" });
      if (movimiento.estado !== "SOLICITADO") {
        return reply
          .code(409)
          .send({ error: "Este movimiento no está en estado SOLICITADO" });
      }

      return prisma.movimientoInventario.update({
        where: { id: request.params.id },
        data: {
          estado: "DESPACHADO",
          usuarioDespachaId: usuarioId,
          fechaDespacho: new Date(),
        },
      });
    },
  );

  // Confirmar (paso 3 — quien recibe confirma, y AHÍ es cuando afecta el stock real)
  app.post<{ Params: { id: string } }>(
    "/movimientos-inventario/:id/confirmar",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub: usuarioId } = (request as any).user;
      const movimiento = await prisma.movimientoInventario.findFirst({
        where: { id: request.params.id },
      });

      if (!movimiento)
        return reply.code(404).send({ error: "Movimiento no encontrado" });
      if (movimiento.estado !== "DESPACHADO") {
        return reply
          .code(409)
          .send({ error: "Este movimiento no está en estado DESPACHADO" });
      }

      return prisma.movimientoInventario.update({
        where: { id: request.params.id },
        data: {
          estado: "CONFIRMADO",
          usuarioConfirmaId: usuarioId,
          fechaConfirmacion: new Date(),
        },
      });
    },
  );
}
