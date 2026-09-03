import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";

export default async function reportesRoutes(app: FastifyInstance) {
  // Reporte de ventas por sede
  app.get<{
    Querystring: {
      sedeId?: string;
      turnoId?: string;
      fechaInicio?: string;
      fechaFin?: string;
    };
  }>(
    "/reportes/ventas",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const { sedeId, turnoId, fechaInicio, fechaFin } = request.query;

      const where: any = { empresaId, tipoDocumento: "FACTURA_VENTA" };
      if (sedeId) where.sedeId = sedeId;
      if (turnoId) where.turnoId = turnoId;
      if (fechaInicio || fechaFin) {
        where.fechaEmision = {};
        if (fechaInicio) where.fechaEmision.gte = new Date(fechaInicio);
        if (fechaFin) where.fechaEmision.lte = new Date(fechaFin);
      }

      const facturas = await prisma.factura.findMany({
        where,
        select: {
          sedeId: true,
          subtotal: true,
          totalDescuento: true,
          totalIva: true,
          totalInc: true,

          total: true,
          sede: { select: { nombre: true } },
        },
      });

      const resumenPorSede = new Map<string, any>();
      for (const f of facturas) {
        if (!resumenPorSede.has(f.sedeId)) {
          resumenPorSede.set(f.sedeId, {
            sedeId: f.sedeId,
            sedeNombre: f.sede.nombre,
            cantidadFacturas: 0,
            subtotal: 0,
            totalDescuento: 0,
            totalIva: 0,
            totalInc: 0,
            total: 0,
          });
        }
        const r = resumenPorSede.get(f.sedeId);
        r.cantidadFacturas += 1;
        r.subtotal += Number(f.subtotal);
        r.totalDescuento += Number(f.totalDescuento);
        r.totalIva += Number(f.totalIva);
        r.totalInc += Number(f.totalInc);
        r.total += Number(f.total);
      }

      return Array.from(resumenPorSede.values());
    },
  );

  // Reporte de descuadres (caja + vending)
  app.get<{ Querystring: { fechaInicio?: string; fechaFin?: string } }>(
    "/reportes/descuadres",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const { fechaInicio, fechaFin } = request.query;

      const whereTurno: any = {
        sede: { empresaId },
        estado: "CERRADO",
        descuadre: { not: 0 },
      };
      if (fechaInicio || fechaFin) {
        whereTurno.fechaCierre = {};
        if (fechaInicio) whereTurno.fechaCierre.gte = new Date(fechaInicio);
        if (fechaFin) whereTurno.fechaCierre.lte = new Date(fechaFin);
      }

      const turnosDescuadrados = await prisma.turno.findMany({
        where: whereTurno,
        select: {
          id: true,
          fechaApertura: true,
          fechaCierre: true,
          descuadre: true,
          sede: { select: { id: true, nombre: true } },
          usuarioCierre: { select: { id: true, nombreCompleto: true } },
        },
        orderBy: { fechaCierre: "desc" },
      });

      const whereAuditoria: any = { maquina: { empresaId } };
      if (fechaInicio || fechaFin) {
        whereAuditoria.fecha = {};
        if (fechaInicio) whereAuditoria.fecha.gte = new Date(fechaInicio);
        if (fechaFin) whereAuditoria.fecha.lte = new Date(fechaFin);
      }

      const arqueosDescuadrados = await prisma.arqueoMonedero.findMany({
        where: { descuadre: { not: 0 }, auditoria: whereAuditoria },
        include: {
          auditoria: {
            select: {
              id: true,
              fecha: true,
              maquina: { select: { id: true, codigo: true, nombre: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return { turnosDescuadrados, arqueosDescuadrados };
    },
  );

  // Cuentas por cobrar/pagar vencidas
  app.get(
    "/reportes/cuentas-vencidas",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request: any) => {
      const { empresaId } = request.user;
      const hoy = new Date();

      const cuentasPorCobrarVencidas = await prisma.cuentaPorCobrar.findMany({
        where: {
          tercero: { empresaId },
          estado: { not: "PAGADA" },
          fechaVencimiento: { lt: hoy },
        },
        include: {
          tercero: { select: { id: true, nombreCompleto: true } },
          factura: { select: { prefijo: true, numero: true } },
        },
      });

      const cuentasPorPagarVencidas = await prisma.cuentaPorPagar.findMany({
        where: {
          empresaId,
          estado: { not: "PAGADA" },
          fechaVencimiento: { lt: hoy },
        },
        include: { tercero: { select: { id: true, nombreCompleto: true } } },
      });

      return { cuentasPorCobrarVencidas, cuentasPorPagarVencidas };
    },
  );
}
