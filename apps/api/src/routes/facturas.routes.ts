import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate } from "../middleware/auth.js";

const IVA_PORCENTAJE = 19;
const INC_PORCENTAJE = 8;

interface DetalleInput {
  productoId: string;
  cantidad: number;
  descuento?: number;
}

interface PagoInput {
  medioPago: "EFECTIVO" | "NEQUI" | "DATAFONO" | "CREDITO";
  monto: number;
  referencia?: string;
}

export default async function facturasRoutes(app: FastifyInstance) {
  app.post<{
    Body: {
      terceroId?: string;
      sedeId?: string;
      prefijo?: string;
      detalles: DetalleInput[];
      pagos: PagoInput[];
    };
  }>("/facturas", { preHandler: [authenticate] }, async (request, reply) => {
    const {
      sub: usuarioId,
      empresaId,
      sedeId: sedeIdUsuario,
      rol,
    } = (request as any).user;
    const {
      terceroId,
      sedeId: sedeIdBody,
      prefijo = "POS",
      detalles,
      pagos,
    } = request.body;

    if (!detalles || detalles.length === 0) {
      return reply
        .code(400)
        .send({ error: "La factura debe tener al menos un producto" });
    }
    if (!pagos || pagos.length === 0) {
      return reply
        .code(400)
        .send({ error: "La factura debe tener al menos un pago" });
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

    if (!turno) {
      return reply
        .code(400)
        .send({
          error:
            "No hay un turno abierto en esta sede. Abre turno antes de vender.",
        });
    }

    const productoIds = detalles.map((d) => d.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds }, empresaId },
    });

    if (productos.length !== new Set(productoIds).size) {
      return reply
        .code(400)
        .send({
          error: "Uno o más productos no existen o no pertenecen a la empresa",
        });
    }

    const productosMap = new Map(productos.map((p) => [p.id, p]));

    try {
      let subtotal = 0;
      let totalDescuento = 0;
      let totalIva = 0;
      let totalInc = 0;

      const detallesData = detalles.map((d) => {
        const producto = productosMap.get(d.productoId)!;

        if (producto.tipo === "INSUMO") {
          throw new Error(
            `El producto "${producto.nombre}" es un insumo, no se puede vender directamente`,
          );
        }
        if (producto.precioVenta === null) {
          throw new Error(
            `El producto "${producto.nombre}" no tiene precio de venta definido`,
          );
        }

        const precioUnitario = Number(producto.precioVenta);
        const descuento = d.descuento ?? 0;
        const baseGravable = precioUnitario * d.cantidad - descuento;

        const porcentajeInc = producto.aplicaInc ? INC_PORCENTAJE : 0;
        const porcentajeIva = producto.aplicaInc ? 0 : IVA_PORCENTAJE;
        const valorInc = (baseGravable * porcentajeInc) / 100;
        const valorIva = (baseGravable * porcentajeIva) / 100;

        subtotal += precioUnitario * d.cantidad;
        totalDescuento += descuento;
        totalIva += valorIva;
        totalInc += valorInc;

        return {
          productoId: producto.id,
          cantidad: d.cantidad,
          precioUnitario,
          porcentajeIva,
          valorIva,
          porcentajeInc,
          valorInc,
          descuento,
          total: baseGravable + valorInc + valorIva,
        };
      });

      const total = subtotal - totalDescuento + totalIva + totalInc;
      const totalPagos = pagos.reduce((acc, p) => acc + p.monto, 0);

      if (Math.abs(totalPagos - total) > 0.5) {
        return reply.code(400).send({
          error: "La suma de los pagos no coincide con el total de la factura",
          totalFactura: total,
          totalPagos,
        });
      }

      const factura = await prisma.$transaction(async (tx) => {
        const ultimaFactura = await tx.factura.findFirst({
          where: { empresaId, prefijo },
          orderBy: { numero: "desc" },
        });
        const numero = (ultimaFactura?.numero ?? 0) + 1;

        return tx.factura.create({
          data: {
            empresaId,
            sedeId,
            turnoId: turno.id,
            usuarioId,
            terceroId,
            tipoDocumento: "FACTURA_VENTA",
            prefijo,
            numero,
            fechaEmision: new Date(),
            subtotal,
            totalDescuento,
            totalIva,
            totalInc,
            total,
            estadoDian: "PENDIENTE",
            detalles: { create: detallesData },
            pagos: { create: pagos },
          },
          include: { detalles: true, pagos: true },
        });
      });

      return factura;
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  app.get("/facturas", { preHandler: [authenticate] }, async (request: any) => {
    const { empresaId } = request.user;

    return prisma.factura.findMany({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      include: { detalles: true, pagos: true },
    });
  });

  app.get<{ Params: { id: string } }>(
    "/facturas/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { empresaId } = (request as any).user;
      const factura = await prisma.factura.findFirst({
        where: { id: request.params.id, empresaId },
        include: { detalles: true, pagos: true },
      });
      if (!factura)
        return reply.code(404).send({ error: "Factura no encontrada" });
      return factura;
    },
  );
}
