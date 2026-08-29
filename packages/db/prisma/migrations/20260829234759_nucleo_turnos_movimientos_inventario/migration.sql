-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('COMPRA_ENTRADA', 'TRASLADO', 'VENTA_SALIDA', 'PRODUCCION_CONSUMO', 'PRODUCCION_INGRESO', 'MERMA');

-- CreateEnum
CREATE TYPE "EstadoMovimientoInventario" AS ENUM ('SOLICITADO', 'DESPACHADO', 'CONFIRMADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "motivos_merma" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "afectaCosto" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "motivos_merma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "usuarioAperturaId" TEXT NOT NULL,
    "usuarioCierreId" TEXT,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "efectivoInicial" DECIMAL(12,2) NOT NULL,
    "efectivoDeclaradoCierre" DECIMAL(12,2),
    "efectivoTeoricoCierre" DECIMAL(12,2),
    "descuadre" DECIMAL(12,2),
    "estado" "EstadoTurno" NOT NULL DEFAULT 'ABIERTO',
    "observaciones" TEXT,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "bodegaOrigenId" TEXT,
    "bodegaDestinoId" TEXT,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "tipoMovimiento" "TipoMovimientoInventario" NOT NULL,
    "motivoMermaId" TEXT,
    "estado" "EstadoMovimientoInventario" NOT NULL DEFAULT 'SOLICITADO',
    "usuarioSolicitaId" TEXT,
    "usuarioDespachaId" TEXT,
    "usuarioConfirmaId" TEXT,
    "fechaSolicitud" TIMESTAMP(3),
    "fechaDespacho" TIMESTAMP(3),
    "fechaConfirmacion" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_usuarioAperturaId_fkey" FOREIGN KEY ("usuarioAperturaId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_usuarioCierreId_fkey" FOREIGN KEY ("usuarioCierreId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_bodegaOrigenId_fkey" FOREIGN KEY ("bodegaOrigenId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_motivoMermaId_fkey" FOREIGN KEY ("motivoMermaId") REFERENCES "motivos_merma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioSolicitaId_fkey" FOREIGN KEY ("usuarioSolicitaId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioDespachaId_fkey" FOREIGN KEY ("usuarioDespachaId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioConfirmaId_fkey" FOREIGN KEY ("usuarioConfirmaId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
