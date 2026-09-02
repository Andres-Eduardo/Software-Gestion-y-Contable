import type { FastifyInstance } from "fastify";
import { prisma } from "db";
import { authenticate, requireRole } from "../middleware/auth.js";

export default async function vendingRoutes(app: FastifyInstance) {
  // Máquinas
  app.post<{ Body: { sedeId: string; codigo: string; nombre?: string } }>(
    "/maquinas",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { empresaId } = (request as any).user;
      const { sedeId, codigo, nombre } = request.body;
      return prisma.maquina.create({
        data: { empresaId, sedeId, codigo, nombre },
      });
    },
  );

  app.get("/maquinas", { preHandler: [authenticate] }, async (request: any) => {
    const { empresaId } = request.user;
    return prisma.maquina.findMany({
      where: { empresaId },
      include: {
        sede: { select: { id: true, nombre: true } },
        canisters: true,
      },
    });
  });

  // Canisters
  app.post<{
    Body: {
      maquinaId: string;
      numero: number;
      productoId?: string;
      capacidadMaxima?: number;
    };
  }>(
    "/canisters",
    { preHandler: [authenticate, requireRole("ADMIN", "GERENTE")] },
    async (request) => {
      const { maquinaId, numero, productoId, capacidadMaxima } = request.body;
      return prisma.canister.create({
        data: { maquinaId, numero, productoId, capacidadMaxima },
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    "/maquinas/:id/canisters",
    { preHandler: [authenticate] },
    async (request) => {
      return prisma.canister.findMany({
        where: { maquinaId: request.params.id },
        include: {
          producto: { select: { id: true, nombre: true, precioVenta: true } },
        },
      });
    },
  );

  // Registrar Auditoría Vending completa: conteo + arqueo, en una sola visita
  app.post<{
    Body: {
      maquinaId: string;
      canisters: {
        canisterId: string;
        contadorInicial: number;
        existenciaFisica: number;
        cantidadSurtida?: number;
      }[];
      monedas: {
        denominacion: number;
        cantidad: number;
        pesoGramos?: number;
      }[];
    };
  }>(
    "/auditorias-vending",
    {
      preHandler: [
        authenticate,
        requireRole("ADMIN", "GERENTE", "DOMICILIARIO"),
      ],
    },
    async (request, reply) => {
      const { sub: usuarioId, empresaId } = (request as any).user;
      const { maquinaId, canisters, monedas } = request.body;

      if (!canisters || canisters.length === 0) {
        return reply
          .code(400)
          .send({ error: "Debe reportar al menos un canister" });
      }

      const canisterIds = canisters.map((c) => c.canisterId);
      const canistersDb = await prisma.canister.findMany({
        where: { id: { in: canisterIds } },

        include: { producto: { select: { id: true, precioVenta: true } } },
      });
      const canistersMap = new Map(canistersDb.map((c) => [c.id, c]));

      try {
        let ventaTeorica = 0;
        const canistersData = [];

        for (const c of canisters) {
          const canisterInfo = canistersMap.get(c.canisterId);
          if (!canisterInfo)
            throw new Error(`Canister ${c.canisterId} no encontrado`);

          const auditoriaAnterior =
            await prisma.auditoriaVendingCanister.findFirst({
              where: { canisterId: c.canisterId },
              orderBy: { auditoria: { fecha: "desc" } },
              include: { auditoria: true },
            });

          const lecturaAnterior = auditoriaAnterior
            ? Number(
                auditoriaAnterior.contadorFinal ??
                  auditoriaAnterior.contadorInicial,
              )
            : c.contadorInicial;

          const unidadesVendidas = Math.max(
            0,
            c.contadorInicial - lecturaAnterior,
          );
          const precioVenta = canisterInfo.producto?.precioVenta
            ? Number(canisterInfo.producto.precioVenta)
            : 0;

          ventaTeorica += unidadesVendidas * precioVenta;

          canistersData.push({
            canisterId: c.canisterId,
            contadorInicial: c.contadorInicial,

            contadorFinal: c.contadorInicial,
            existenciaFisica: c.existenciaFisica,
            cantidadSurtida: c.cantidadSurtida ?? 0,
          });
        }

        const detallesMoneda = (monedas ?? []).map((m) => ({
          denominacion: m.denominacion,
          cantidad: m.cantidad,
          pesoGramos: m.pesoGramos,
          subtotal: m.denominacion * m.cantidad,
        }));
        const ventaRecaudada = detallesMoneda.reduce(
          (acc, d) => acc + d.subtotal,
          0,
        );
        const descuadre = ventaRecaudada - ventaTeorica;

        return await prisma.auditoriaVending.create({
          data: {
            maquinaId,
            usuarioId,
            estado: "FINALIZADA",
            canisters: { create: canistersData },
            arqueo: {
              create: {
                ventaTeorica,
                ventaRecaudada,
                descuadre,
                detalles: { create: detallesMoneda },
              },
            },
          },
          include: { canisters: true, arqueo: { include: { detalles: true } } },
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err.message });
      }
    },
  );

  app.get("/auditorias-vending", { preHandler: [authenticate] }, async () => {
    return prisma.auditoriaVending.findMany({
      orderBy: { fecha: "desc" },
      include: {
        maquina: { select: { id: true, codigo: true, nombre: true } },
        usuario: { select: { id: true, nombreCompleto: true, rol: true } },
        canisters: true,
        arqueo: { include: { detalles: true } },
      },
    });
  });
}
