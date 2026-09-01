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
      return reply.code(400).send({
        error:
          "No hay un turno abierto en esta sede. Abre turno antes de vender.",
      });
    }

    const productoIds = detalles.map((d) => d.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds }, empresaId },
    });

    if (productos.length !== new Set(productoIds).size) {
      return reply.code(400).send({
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

  // Nota Crédito — referencia líneas de la factura original, respeta precio/tarifas históricas
  app.post<{
    Params: { id: string };
    Body: {
      motivoNotaId: string;
      detalles: { productoId: string; cantidad: number }[];
      observaciones?: string;
      prefijo?: string;
    };
  }>(
    "/facturas/:id/nota-credito",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const { id } = request.params;
      const {
        motivoNotaId,
        detalles,
        observaciones,
        prefijo = "NC",
      } = request.body;

      const facturaOriginal = await prisma.factura.findFirst({
        where: { id, empresaId, tipoDocumento: "FACTURA_VENTA" },
        include: { detalles: true },
      });

      if (!facturaOriginal) {
        return reply
          .code(404)
          .send({ error: "Factura original no encontrada" });
      }
      if (!detalles || detalles.length === 0) {
        return reply.code(400).send({
          error: "La nota crédito debe incluir al menos un producto",
        });
      }

      try {
        let subtotal = 0;
        let totalIva = 0;
        let totalInc = 0;

        const detallesData = detalles.map((d) => {
          const lineaOriginal = facturaOriginal.detalles.find(
            (det) => det.productoId === d.productoId,
          );
          if (!lineaOriginal) {
            throw new Error(
              `El producto ${d.productoId} no está en la factura original`,
            );
          }
          if (d.cantidad > Number(lineaOriginal.cantidad)) {
            throw new Error(
              `No puedes acreditar ${d.cantidad} unidades, solo se vendieron ${lineaOriginal.cantidad}`,
            );
          }

          const precioUnitario = Number(lineaOriginal.precioUnitario);
          const porcentajeIva = Number(lineaOriginal.porcentajeIva);
          const porcentajeInc = Number(lineaOriginal.porcentajeInc);
          const baseGravable = precioUnitario * d.cantidad;
          const valorIva = (baseGravable * porcentajeIva) / 100;
          const valorInc = (baseGravable * porcentajeInc) / 100;

          subtotal += baseGravable;
          totalIva += valorIva;
          totalInc += valorInc;

          return {
            productoId: d.productoId,
            cantidad: d.cantidad,
            precioUnitario,
            porcentajeIva,
            valorIva,
            porcentajeInc,
            valorInc,
            descuento: 0,
            total: baseGravable + valorIva + valorInc,
          };
        });

        const total = subtotal + totalIva + totalInc;

        const nota = await prisma.$transaction(async (tx) => {
          const ultima = await tx.factura.findFirst({
            where: { empresaId, prefijo },
            orderBy: { numero: "desc" },
          });
          const numero = (ultima?.numero ?? 0) + 1;

          return tx.factura.create({
            data: {
              empresaId,
              sedeId: facturaOriginal.sedeId,
              turnoId: facturaOriginal.turnoId,
              usuarioId,
              terceroId: facturaOriginal.terceroId,
              tipoDocumento: "NOTA_CREDITO",
              documentoReferenciaId: facturaOriginal.id,
              motivoNotaId,
              prefijo,
              numero,
              fechaEmision: new Date(),
              subtotal,
              totalDescuento: 0,
              totalIva,
              totalInc,
              total,
              estadoDian: "PENDIENTE",
              observaciones,
              detalles: { create: detallesData },
            },
            include: { detalles: true },
          });
        });

        return nota;
      } catch (err: any) {
        return reply.code(400).send({ error: err.message });
      }
    },
  );

  // Nota Débito — cargo adicional, usa precio ACTUAL del producto, no está limitada a la factura original
  app.post<{
    Params: { id: string };
    Body: {
      motivoNotaId: string;
      detalles: { productoId: string; cantidad: number }[];
      observaciones?: string;
      prefijo?: string;
    };
  }>(
    "/facturas/:id/nota-debito",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const { id } = request.params;
      const {
        motivoNotaId,
        detalles,
        observaciones,
        prefijo = "ND",
      } = request.body;

      const facturaOriginal = await prisma.factura.findFirst({
        where: { id, empresaId, tipoDocumento: "FACTURA_VENTA" },
      });

      if (!facturaOriginal) {
        return reply
          .code(404)
          .send({ error: "Factura original no encontrada" });
      }

      if (!detalles || detalles.length === 0) {
        return reply.code(400).send({
          error: "La nota débito debe incluir al menos un concepto",
        });
      }

      const productoIds = detalles.map((d) => d.productoId);
      const productos = await prisma.producto.findMany({
        where: { id: { in: productoIds }, empresaId },
      });
      const productosMap = new Map(productos.map((p) => [p.id, p]));

      try {
        let subtotal = 0;
        let totalIva = 0;
        let totalInc = 0;

        const detallesData = detalles.map((d) => {
          const producto = productosMap.get(d.productoId);
          if (!producto)
            throw new Error(`Producto ${d.productoId} no encontrado`);
          if (producto.precioVenta === null)
            throw new Error(
              `El producto "${producto.nombre}" no tiene precio de venta`,
            );

          const precioUnitario = Number(producto.precioVenta);
          const porcentajeInc = producto.aplicaInc ? INC_PORCENTAJE : 0;
          const porcentajeIva = producto.aplicaInc ? 0 : IVA_PORCENTAJE;
          const baseGravable = precioUnitario * d.cantidad;
          const valorIva = (baseGravable * porcentajeIva) / 100;
          const valorInc = (baseGravable * porcentajeInc) / 100;

          subtotal += baseGravable;
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
            descuento: 0,
            total: baseGravable + valorIva + valorInc,
          };
        });

        const total = subtotal + totalIva + totalInc;

        const nota = await prisma.$transaction(async (tx) => {
          const ultima = await tx.factura.findFirst({
            where: { empresaId, prefijo },
            orderBy: { numero: "desc" },
          });
          const numero = (ultima?.numero ?? 0) + 1;

          return tx.factura.create({
            data: {
              empresaId,
              sedeId: facturaOriginal.sedeId,
              turnoId: facturaOriginal.turnoId,
              usuarioId,
              terceroId: facturaOriginal.terceroId,
              tipoDocumento: "NOTA_DEBITO",
              documentoReferenciaId: facturaOriginal.id,
              motivoNotaId,
              prefijo,
              numero,
              fechaEmision: new Date(),
              subtotal,
              totalDescuento: 0,
              totalIva,
              totalInc,
              total,
              estadoDian: "PENDIENTE",
              observaciones,
              detalles: { create: detallesData },
            },
            include: { detalles: true },
          });
        });

        return nota;
      } catch (err: any) {
        return reply.code(400).send({ error: err.message });
      }
    },
  );
}
