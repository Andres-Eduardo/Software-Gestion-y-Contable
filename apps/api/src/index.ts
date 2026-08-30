import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import Fastify from "fastify";
import { prisma } from "db";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "opa-api" };
});

app.get("/empresas", async () => {
  const empresas = await prisma.empresa.findMany();
  return empresas;
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
