-- CreateEnum
CREATE TYPE "EstadoCuentaFinanciera" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');

-- CreateTable
CREATE TABLE "cuentas_por_cobrar" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "terceroId" TEXT NOT NULL,
    "montoOriginal" DECIMAL(12,2) NOT NULL,
    "saldoPendiente" DECIMAL(12,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoCuentaFinanciera" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_por_cobrar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_cuenta_por_cobrar" (
    "id" TEXT NOT NULL,
    "cuentaPorCobrarId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medioPago" "MedioPago" NOT NULL,
    "usuarioRegistraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_cuenta_por_cobrar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_pagar" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "terceroId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "montoOriginal" DECIMAL(12,2) NOT NULL,
    "saldoPendiente" DECIMAL(12,2) NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoCuentaFinanciera" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_por_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_cuenta_por_pagar" (
    "id" TEXT NOT NULL,
    "cuentaPorPagarId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medioPago" "MedioPago" NOT NULL,
    "usuarioRegistraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_cuenta_por_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_por_cobrar_facturaId_key" ON "cuentas_por_cobrar"("facturaId");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_estado_idx" ON "cuentas_por_cobrar"("estado");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_estado_idx" ON "cuentas_por_pagar"("estado");

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "terceros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuenta_por_cobrar" ADD CONSTRAINT "pagos_cuenta_por_cobrar_cuentaPorCobrarId_fkey" FOREIGN KEY ("cuentaPorCobrarId") REFERENCES "cuentas_por_cobrar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuenta_por_cobrar" ADD CONSTRAINT "pagos_cuenta_por_cobrar_usuarioRegistraId_fkey" FOREIGN KEY ("usuarioRegistraId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "terceros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuenta_por_pagar" ADD CONSTRAINT "pagos_cuenta_por_pagar_cuentaPorPagarId_fkey" FOREIGN KEY ("cuentaPorPagarId") REFERENCES "cuentas_por_pagar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuenta_por_pagar" ADD CONSTRAINT "pagos_cuenta_por_pagar_usuarioRegistraId_fkey" FOREIGN KEY ("usuarioRegistraId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
