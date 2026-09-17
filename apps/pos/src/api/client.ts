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
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error ?? `Error ${response.status}`);
  }

  return response.json();
}
