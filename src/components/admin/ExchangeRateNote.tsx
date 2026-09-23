import { formatMoney } from "@/utils/adminFormat";

export function ExchangeRateNote({ usdBrlRate }: { usdBrlRate: number }) {
  return (
    <p className="text-xs text-muted">
      Câmbio usado: {formatMoney(1, usdBrlRate).brl} por US$ 1 (configurado no servidor). Os custos são estimados com a
      tabela de preços do servidor no momento de cada chamada.
    </p>
  );
}
