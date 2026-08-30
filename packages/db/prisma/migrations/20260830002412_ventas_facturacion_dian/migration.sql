-- CreateEnum
CREATE TYPE "TipoDocumentoDian" AS ENUM ('FACTURA_VENTA', 'NOTA_CREDITO', 'NOTA_DEBITO');

-- CreateEnum
CREATE TYPE "EstadoDian" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'ACEPTADO', 'RECHAZADO', 'CONTINGENCIA');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'NEQUI', 'DATAFONO', 'CREDITO');

-- CreateTable
CREATE TABLE "motivos_nota_ajuste" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumentoDian" NOT NULL,

    CONSTRAINT "motivos_nota_ajuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "turnoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "terceroId" TEXT,
    "tipoDocumento" "TipoDocumentoDian" NOT NULL,
    "documentoReferenciaId" TEXT,
    "motivoNotaId" TEXT,
    "prefijo" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "totalDescuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalIva" DECIMAL(12,2) NOT NULL,
    "totalInc" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "estadoDian" "EstadoDian" NOT NULL DEFAULT 'PENDIENTE',
    "cufe" TEXT,
    "xmlPath" TEXT,
    "pdfPath" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_facturas" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "porcentajeIva" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valorIva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "porcentajeInc" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valorInc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalle_facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_factura" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "medioPago" "MedioPago" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja_menor" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "turnoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "soporteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caja_menor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facturas_cufe_key" ON "facturas"("cufe");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_empresaId_prefijo_numero_key" ON "facturas"("empresaId", "prefijo", "numero");

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_documentoReferenciaId_fkey" FOREIGN KEY ("documentoReferenciaId") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_motivoNotaId_fkey" FOREIGN KEY ("motivoNotaId") REFERENCES "motivos_nota_ajuste"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_facturas" ADD CONSTRAINT "detalle_facturas_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_facturas" ADD CONSTRAINT "detalle_facturas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_factura" ADD CONSTRAINT "pagos_factura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_menor" ADD CONSTRAINT "caja_menor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_menor" ADD CONSTRAINT "caja_menor_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_menor" ADD CONSTRAINT "caja_menor_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_menor" ADD CONSTRAINT "caja_menor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
