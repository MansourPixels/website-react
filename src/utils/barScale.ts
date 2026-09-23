/**
 * A altura (ou largura) de cada barra, em unidades de `size`, proporcional ao
 * maior valor. Tudo zero dá barras zeradas em vez de dividir por zero.
 */
export function barScale(values: number[], size: number): number[] {
  const max = Math.max(0, ...values.map((value) => (Number.isFinite(value) ? value : 0)));

  return values.map((value) => (max === 0 || !Number.isFinite(value) ? 0 : (Math.max(0, value) / max) * size));
}

/** A fatia de cada valor no total, em pontos percentuais inteiros que somam 100 (maior resto). */
export function shares(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total === 0) return values.map(() => 0);

  const exact = values.map((value) => (Math.max(0, value) / total) * 100);
  const floors = exact.map(Math.floor);
  let missing = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest);
  for (const { index } of order) {
    if (missing <= 0) break;
    floors[index] += 1;
    missing -= 1;
  }

  return floors;
}
