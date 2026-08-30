export async function authenticate(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: "Token inválido o expirado" });
  }
}

export function requireRole(...rolesPermitidos: string[]) {
  return async function (request: any, reply: any) {
    const { rol } = request.user;
    if (!rolesPermitidos.includes(rol)) {
      reply.code(403).send({ error: "No tienes permiso para esta acción" });
    }
  };
}
