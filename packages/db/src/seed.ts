import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import bcrypt from "bcryptjs";
import { prisma } from "./index.js";

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { nit: "901061650" },
    update: {},
    create: {
      nit: "901061650",
      dv: 7,
      razonSocial: "Opa Aroma & Sabor S.A.S.",
      nombreComercial: "Opa",
      responsableIva: true,
      responsableInc: true,
    },
  });

  const sedeCentral = await prisma.sede.upsert({
    where: { id: "seed-bodega-central" },
    update: {},
    create: {
      id: "seed-bodega-central",
      empresaId: empresa.id,
      nombre: "Bodega Central",
      tipo: "BODEGA_CENTRAL",
    },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@opa.test" },
    update: {},
    create: {
      empresaId: empresa.id,
      nombreCompleto: "Administrador Opa",
      email: "admin@opa.test",
      passwordHash,
      rol: "ADMIN",
      sedeId: sedeCentral.id,
    },
  });

  await prisma.unidadMedida.createMany({
    data: [
      { nombre: "Gramo", simbolo: "gr", tipo: "PESO" },
      { nombre: "Kilogramo", simbolo: "kg", tipo: "PESO" },
      { nombre: "Mililitro", simbolo: "ml", tipo: "VOLUMEN" },
      { nombre: "Litro", simbolo: "l", tipo: "VOLUMEN" },
      { nombre: "Unidad", simbolo: "un", tipo: "UNIDAD" },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completado:");
  console.log({ empresa: empresa.razonSocial, admin: admin.email });

  await prisma.motivoNotaAjuste.upsert({
    where: { id: "seed-motivo-devolucion" },
    update: {},
    create: {
      id: "seed-motivo-devolucion",
      nombre: "Devolución de producto",
      tipoDocumento: "NOTA_CREDITO",
    },
  });
  await prisma.motivoNotaAjuste.upsert({
    where: { id: "seed-motivo-cobro-adicional" },
    update: {},
    create: {
      id: "seed-motivo-cobro-adicional",
      nombre: "Cobro adicional no facturado",
      tipoDocumento: "NOTA_DEBITO",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
