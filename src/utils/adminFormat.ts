const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const USD_CENTS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const USD_SMALL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

export interface Money {
  /** Em destaque na tela. */
  brl: string;
  /** Menor, ao lado: o valor como foi registrado. */
  usd: string;
}

/**
 * Um custo em dólar mostrado em reais com a cotação do servidor, e o dólar ao
 * lado. Abaixo de US$ 0,01 o dólar ganha 4 casas, senão um custo pequeno e
 * real apareceria como "US$ 0,00".
 */
export function formatMoney(usd: number, usdBrlRate: number): Money {
  const value = Number.isFinite(usd) ? usd : 0;

  return {
    brl: BRL.format(value * usdBrlRate),
    usd: (value !== 0 && Math.abs(value) < 0.01 ? USD_SMALL : USD_CENTS).format(value),
  };
}

const INTEGER = new Intl.NumberFormat("pt-BR");

export function formatCount(value: number): string {
  return INTEGER.format(Number.isFinite(value) ? value : 0);
}

/** "1 chamada", "2 chamadas": a contagem formatada com o substantivo no número certo. */
export function countOf(value: number, singular: string, plural: string): string {
  return `${formatCount(value)} ${value === 1 ? singular : plural}`;
}
