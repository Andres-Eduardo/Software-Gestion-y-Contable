-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('TERMINO_FIJO', 'TERMINO_INDEFINIDO', 'PRESTACION_SERVICIOS', 'APRENDIZ');

-- CreateEnum
CREATE TYPE "TipoMovimientoCuentaCorriente" AS ENUM ('ANTICIPO', 'PRESTAMO', 'CONSUMO_INTERNO', 'ABONO');

-- CreateEnum
CREATE TYPE "EstadoNomina" AS ENUM ('BORRADOR', 'APROBADA', 'PAGADA');

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nombreCompleto" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaRetiro" TIMESTAMP(3),
    "salarioBase" DECIMAL(12,2) NOT NULL,
    "tipoContrato" "TipoContrato" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuenta_corriente_empleados" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" "TipoMovimientoCuentaCorriente" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "usuarioRegistraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuenta_corriente_empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoNomina" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nominas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomina_detalles" (
    "id" TEXT NOT NULL,
    "nominaId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "salarioBase" DECIMAL(12,2) NOT NULL,
    "totalDevengado" DECIMAL(12,2) NOT NULL,
    "totalDeducciones" DECIMAL(12,2) NOT NULL,
    "saldoCuentaCorrienteDescontado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalNeto" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "nomina_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuarioId_key" ON "empleados"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_documento_key" ON "empleados"("documento");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta_corriente_empleados" ADD CONSTRAINT "cuenta_corriente_empleados_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta_corriente_empleados" ADD CONSTRAINT "cuenta_corriente_empleados_usuarioRegistraId_fkey" FOREIGN KEY ("usuarioRegistraId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominas" ADD CONSTRAINT "nominas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_detalles" ADD CONSTRAINT "nomina_detalles_nominaId_fkey" FOREIGN KEY ("nominaId") REFERENCES "nominas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_detalles" ADD CONSTRAINT "nomina_detalles_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
