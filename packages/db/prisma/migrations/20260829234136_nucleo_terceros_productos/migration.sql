-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('PESO', 'VOLUMEN', 'UNIDAD');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('NATURAL', 'JURIDICA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CC', 'NIT', 'CE', 'PASAPORTE');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('INSUMO', 'VENDIBLE_PROPIO', 'VENDIBLE_REVENTA');

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "tipo" "TipoUnidad" NOT NULL,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terceros" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipoPersona" "TipoPersona" NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "dv" INTEGER,
    "nombreCompleto" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "esCliente" BOOLEAN NOT NULL DEFAULT true,
    "esProveedor" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terceros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoProducto" NOT NULL,
    "unidadMedidaId" TEXT NOT NULL,
    "precioVenta" DECIMAL(12,2),
    "aplicaInc" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terceros_empresaId_numeroDocumento_key" ON "terceros"("empresaId", "numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "productos_empresaId_codigo_key" ON "productos"("empresaId", "codigo");

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_unidadMedidaId_fkey" FOREIGN KEY ("unidadMedidaId") REFERENCES "unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
