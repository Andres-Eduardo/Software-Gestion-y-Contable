import { prisma } from "db";

export async function calcularSaldoPendiente(
  empleadoId: string,
): Promise<number> {
  const deudas = await prisma.cuentaCorrienteEmpleado.aggregate({
    where: {
      empleadoId,
      tipo: { in: ["ANTICIPO", "PRESTAMO", "CONSUMO_INTERNO"] },
    },
    _sum: { monto: true },
  });
  const abonos = await prisma.cuentaCorrienteEmpleado.aggregate({
    where: { empleadoId, tipo: "ABONO" },
    _sum: { monto: true },
  });
  return Number(deudas._sum.monto ?? 0) - Number(abonos._sum.monto ?? 0);
}
