import { prisma } from "db";

export async function calcularStock(
  sedeId: string,
  productoId: string,
): Promise<number> {
  const entradas = await prisma.movimientoInventario.aggregate({
    where: { bodegaDestinoId: sedeId, productoId, estado: "CONFIRMADO" },
    _sum: { cantidad: true },
  });
  const salidas = await prisma.movimientoInventario.aggregate({
    where: { bodegaOrigenId: sedeId, productoId, estado: "CONFIRMADO" },
    _sum: { cantidad: true },
  });
  return (
    Number(entradas._sum.cantidad ?? 0) - Number(salidas._sum.cantidad ?? 0)
  );
}
