const BASE_URL = "/api";

interface OpcionesFetch extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  path: string,
  opciones: OpcionesFetch = {},
): Promise<T> {
  const { token, headers, ...resto } = opciones;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...resto,
    headers: {
      ...(resto.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const mensaje = body.message ?? body.error ?? `Error ${response.status}`;
    throw new Error(mensaje);
  }

  return response.json();
}
