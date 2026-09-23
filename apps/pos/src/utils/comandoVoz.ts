interface ProductoParaVoz {
  id: string;
  nombre: string;
  precioVenta: string | null;
  aplicaInc: boolean;
}

const NUMEROS_TEXTO: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

const PALABRAS_VACIAS = new Set([
  "de",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
]);

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function singularizar(palabra: string): string {
  return palabra.length > 3 && palabra.endsWith("s")
    ? palabra.slice(0, -1)
    : palabra;
}

function tokenizar(texto: string): string[] {
  return quitarAcentos(texto.toLowerCase())
    .split(/\s+/)
    .map(singularizar)
    .filter((p) => p && !PALABRAS_VACIAS.has(p));
}

function extraerCantidad(transcript: string): number {
  const palabras = quitarAcentos(transcript.toLowerCase()).split(/\s+/);
  for (const p of palabras) {
    if (/^\d+$/.test(p)) return parseInt(p, 10);
    if (NUMEROS_TEXTO[p] !== undefined) return NUMEROS_TEXTO[p];
  }
  return 1;
}

export interface ResultadoComandoVoz {
  producto: ProductoParaVoz;
  cantidad: number;
}

export function interpretarComandoVoz(
  transcript: string,
  productos: ProductoParaVoz[],
): ResultadoComandoVoz | null {
  const tokensDicho = tokenizar(transcript);
  if (tokensDicho.length === 0) return null;

  let mejor: { producto: ProductoParaVoz; score: number } | null = null;

  for (const producto of productos) {
    const tokensNombre = tokenizar(producto.nombre);
    if (tokensNombre.length === 0) continue;
    const coincidencias = tokensNombre.filter((t) =>
      tokensDicho.includes(t),
    ).length;
    const score = coincidencias / tokensNombre.length;
    if (score >= 0.5 && (!mejor || score > mejor.score)) {
      mejor = { producto, score };
    }
  }

  if (!mejor) return null;
  return { producto: mejor.producto, cantidad: extraerCantidad(transcript) };
}
