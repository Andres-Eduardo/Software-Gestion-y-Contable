-- CreateEnum
CREATE TYPE "EstadoAuditoriaVending" AS ENUM ('EN_PROCESO', 'FINALIZADA');

-- CreateTable
CREATE TABLE "maquinas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canisters" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "productoId" TEXT,
    "capacidadMaxima" INTEGER,

    CONSTRAINT "canisters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias_vending" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoAuditoriaVending" NOT NULL DEFAULT 'EN_PROCESO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auditorias_vending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_vending_canisters" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "canisterId" TEXT NOT NULL,
    "contadorInicial" INTEGER NOT NULL,
    "contadorFinal" INTEGER,
    "existenciaFisica" INTEGER NOT NULL,
    "cantidadSurtida" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "auditoria_vending_canisters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arqueos_monedero" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "ventaTeorica" DECIMAL(12,2) NOT NULL,
    "ventaRecaudada" DECIMAL(12,2) NOT NULL,
    "descuadre" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arqueos_monedero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arqueo_moneda_detalles" (
    "id" TEXT NOT NULL,
    "arqueoId" TEXT NOT NULL,
    "denominacion" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "pesoGramos" DECIMAL(10,2),
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "arqueo_moneda_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maquinas_codigo_key" ON "maquinas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "canisters_maquinaId_numero_key" ON "canisters"("maquinaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "arqueos_monedero_auditoriaId_key" ON "arqueos_monedero"("auditoriaId");

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canisters" ADD CONSTRAINT "canisters_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canisters" ADD CONSTRAINT "canisters_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias_vending" ADD CONSTRAINT "auditorias_vending_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias_vending" ADD CONSTRAINT "auditorias_vending_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_vending_canisters" ADD CONSTRAINT "auditoria_vending_canisters_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "auditorias_vending"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_vending_canisters" ADD CONSTRAINT "auditoria_vending_canisters_canisterId_fkey" FOREIGN KEY ("canisterId") REFERENCES "canisters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arqueos_monedero" ADD CONSTRAINT "arqueos_monedero_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "auditorias_vending"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arqueo_moneda_detalles" ADD CONSTRAINT "arqueo_moneda_detalles_arqueoId_fkey" FOREIGN KEY ("arqueoId") REFERENCES "arqueos_monedero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
