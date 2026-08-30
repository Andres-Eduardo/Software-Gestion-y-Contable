-- CreateEnum
CREATE TYPE "EstadoLoteProduccion" AS ENUM ('EN_PROCESO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "recetas" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rendimiento" DECIMAL(12,3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receta_detalles" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "unidadMedidaId" TEXT NOT NULL,

    CONSTRAINT "receta_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_produccion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cantidadProducidaReal" DECIMAL(12,3),
    "fechaProduccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoLoteProduccion" NOT NULL DEFAULT 'EN_PROCESO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_produccion_insumos" (
    "id" TEXT NOT NULL,
    "loteProduccionId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidadTeorica" DECIMAL(12,3) NOT NULL,
    "cantidadReal" DECIMAL(12,3),
    "variacion" DECIMAL(12,3),

    CONSTRAINT "lote_produccion_insumos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facturas_estadoDian_idx" ON "facturas"("estadoDian");

-- CreateIndex
CREATE INDEX "turnos_estado_idx" ON "turnos"("estado");

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_detalles" ADD CONSTRAINT "receta_detalles_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "recetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_detalles" ADD CONSTRAINT "receta_detalles_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_detalles" ADD CONSTRAINT "receta_detalles_unidadMedidaId_fkey" FOREIGN KEY ("unidadMedidaId") REFERENCES "unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_produccion" ADD CONSTRAINT "lotes_produccion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_produccion" ADD CONSTRAINT "lotes_produccion_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "recetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_produccion" ADD CONSTRAINT "lotes_produccion_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_produccion" ADD CONSTRAINT "lotes_produccion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_produccion_insumos" ADD CONSTRAINT "lote_produccion_insumos_loteProduccionId_fkey" FOREIGN KEY ("loteProduccionId") REFERENCES "lotes_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_produccion_insumos" ADD CONSTRAINT "lote_produccion_insumos_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
