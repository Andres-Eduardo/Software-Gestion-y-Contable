import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";
import { calcularStock } from "../utils/inventario.util.js";

export default async function produccionRoutes(app: FastifyInstance) {
  // Crear Receta (desactiva automáticamente versiones anteriores del mismo producto)
  app.post<{
    Body: {
      productoId: string;
      nombre: string;
      rendimiento: number;
      detalles: {
        insumoId: string;
        cantidad: number;
        unidadMedidaId: string;
      }[];
    };
  }>(
    "/recetas",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request, reply) => {
      const body = request.body;
      if (!body.detalles || body.detalles.length === 0) {
        return reply
          .code(400)
          .send({ error: "La receta debe tener al menos un insumo" });
      }

      await prisma.receta.updateMany({
        where: { productoId: body.productoId, activa: true },
        data: { activa: false },
      });

      return prisma.receta.create({
        data: {
          productoId: body.productoId,
          nombre: body.nombre,
          rendimiento: body.rendimiento,
          activa: true,
          detalles: { create: body.detalles },
        },
        include: { detalles: true },
      });
    },
  );

  app.get("/recetas", { preHandler: [authenticate] }, async () => {
    return prisma.receta.findMany({
      include: {
        detalles: true,
        producto: { select: { id: true, nombre: true } },
      },
    });
  });

  // Abrir Lote de Producción (congela los insumos teóricos de la receta)
  app.post<{ Body: { recetaId: string; sedeId?: string } }>(
    "/lotes-produccion",
    {
      preHandler: [authenticate, requireRole("ADMIN", "GERENTE", "PRODUCCION")],
    },
    async (request, reply) => {
      const {
        sub: usuarioId,
        empresaId,
        sedeId: sedeIdUsuario,
        rol,
      } = (request as any).user;
      const { recetaId, sedeId: sedeIdBody } = request.body;

      const sedeId =
        (rol === "ADMIN" || rol === "GERENTE") && sedeIdBody
          ? sedeIdBody
          : sedeIdUsuario;
      if (!sedeId)
        return reply.code(400).send({ error: "No se pudo determinar la sede" });

      const receta = await prisma.receta.findFirst({
        where: { id: recetaId, producto: { empresaId } },
        include: { detalles: true },
      });

      if (!receta)
        return reply.code(404).send({ error: "Receta no encontrada" });

      return prisma.loteProduccion.create({
        data: {
          empresaId,

          recetaId,
          sedeId,
          usuarioId,
          estado: "EN_PROCESO",
          insumos: {
            create: receta.detalles.map((d) => ({
              insumoId: d.insumoId,
              cantidadTeorica: d.cantidad,
            })),
          },
        },
        include: { insumos: true },
      });
    },
  );

  app.get(
    "/lotes-produccion",
    { preHandler: [authenticate] },
    async (request: any) => {
      const { empresaId } = request.user;
      return prisma.loteProduccion.findMany({
        where: { empresaId },
        orderBy: { fechaProduccion: "desc" },
        include: {
          receta: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombreCompleto: true, rol: true } },
          insumos: true,
        },
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    "/lotes-produccion/:id",
    { preHandler: [authenticate] },

    async (request, reply) => {
      const { empresaId } = (request as any).user;
      const lote = await prisma.loteProduccion.findFirst({
        where: { id: request.params.id, empresaId },
        include: { receta: true, insumos: true },
      });
      if (!lote) return reply.code(404).send({ error: "Lote no encontrado" });
      return lote;
    },
  );

  // Cerrar Lote — reporta consumo real, calcula variación, descuenta insumos, ingresa producto terminado
  app.post<{
    Params: { id: string };
    Body: {
      cantidadProducidaReal: number;
      insumos: { insumoId: string; cantidadReal: number }[];
      observaciones?: string;
    };
  }>(
    "/lotes-produccion/:id/cerrar",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const { id } = request.params;
      const { cantidadProducidaReal, insumos, observaciones } = request.body;

      const lote = await prisma.loteProduccion.findFirst({
        where: { id, empresaId },
        include: { insumos: true, receta: true },
      });

      if (!lote) return reply.code(404).send({ error: "Lote no encontrado" });
      if (lote.estado !== "EN_PROCESO") {
        return reply.code(409).send({ error: "Este lote no está en proceso" });
      }

      try {
        for (const i of insumos) {
          const insumoLote = lote.insumos.find(
            (li) => li.insumoId === i.insumoId,
          );
          if (!insumoLote) {
            throw new Error(`El insumo ${i.insumoId} no pertenece a este lote`);
          }
          const stockDisponible = await calcularStock(lote.sedeId, i.insumoId);
          if (stockDisponible < i.cantidadReal) {
            throw new Error(
              `Stock insuficiente del insumo: disponible ${stockDisponible}, requerido ${i.cantidadReal}`,
            );
          }
        }

        const resultado = await prisma.$transaction(async (tx) => {
          for (const i of insumos) {
            const insumoLote = lote.insumos.find(
              (li) => li.insumoId === i.insumoId,
            )!;
            const variacion =
              i.cantidadReal - Number(insumoLote.cantidadTeorica);

            await tx.loteProduccionInsumo.update({
              where: { id: insumoLote.id },
              data: { cantidadReal: i.cantidadReal, variacion },
            });

            await tx.movimientoInventario.create({
              data: {
                empresaId,
                productoId: i.insumoId,
                bodegaOrigenId: lote.sedeId,
                cantidad: i.cantidadReal,

                tipoMovimiento: "PRODUCCION_CONSUMO",
                estado: "CONFIRMADO",
                usuarioConfirmaId: usuarioId,
                fechaConfirmacion: new Date(),
                observaciones: `Consumo lote de producción ${lote.id}`,
              },
            });
          }

          await tx.movimientoInventario.create({
            data: {
              empresaId,
              productoId: lote.receta.productoId,
              bodegaDestinoId: lote.sedeId,
              cantidad: cantidadProducidaReal,
              tipoMovimiento: "PRODUCCION_INGRESO",
              estado: "CONFIRMADO",
              usuarioConfirmaId: usuarioId,
              fechaConfirmacion: new Date(),
              observaciones: `Ingreso producto terminado lote ${lote.id}`,
            },
          });

          return tx.loteProduccion.update({
            where: { id },
            data: {
              cantidadProducidaReal,
              estado: "FINALIZADO",
              observaciones,
            },
            include: { insumos: true },
          });
        });

        return resultado;
      } catch (err: any) {
        return reply.code(400).send({ error: err.message });
      }
    },
  );
}
