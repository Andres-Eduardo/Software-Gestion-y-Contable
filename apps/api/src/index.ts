import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import Fastify from "fastify";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import bcrypt from "bcryptjs";
import { prisma } from "db";
import { authenticate } from "./middleware/auth.js";
import sedesRoutes from "./routes/sedes.routes.js";
import tercerosRoutes from "./routes/terceros.routes.js";
import productosRoutes from "./routes/productos.routes.js";

const app = Fastify({ logger: true });

await app.register(helmet);
await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") ?? true,
});
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
await app.register(jwt, { secret: process.env.JWT_SECRET as string });

app.register(sedesRoutes);
app.register(tercerosRoutes);
app.register(productosRoutes);

app.get("/health", async () => {
  return { status: "ok", service: "opa-api" };
});

app.get("/empresas", async () => {
  return prisma.empresa.findMany();
});

app.post<{ Body: { email: string; password: string } }>(
  "/auth/login",
  { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
  async (request, reply) => {
    const { email, password } = request.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.passwordHash) {
      return reply.code(401).send({ error: "Credenciales inválidas" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return reply.code(401).send({ error: "Credenciales inválidas" });
    }

    const token = app.jwt.sign(
      {
        sub: usuario.id,
        rol: usuario.rol,
        sedeId: usuario.sedeId,
        empresaId: usuario.empresaId,
      },
      { expiresIn: "8h" },
    );

    return { token };
  },
);

app.get("/auth/me", { preHandler: [authenticate] }, async (request: any) => {
  return request.user;
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
