export function calcularDV(nit: string): number {
  const primos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const nitLimpio = nit.replace(/\D/g, "");

  let total = 0;
  for (let i = 0; i < nitLimpio.length; i++) {
    const digito = parseInt(nitLimpio[nitLimpio.length - 1 - i], 10);
    total += digito * primos[i];
  }

  const residuo = total % 11;
  return residuo > 1 ? 11 - residuo : residuo;
}
