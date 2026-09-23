const SAO_PAULO_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * O dia de `now` no fuso da plataforma, como `2026-09-22`: o formato das datas
 * que a API de admin aceita. O "hoje" do servidor é o de São Paulo, então o do
 * navegador não serve (perto da meia-noite, ou fora do Brasil, seria outro dia).
 */
export function saoPauloDay(now: Date = new Date()): string {
  return SAO_PAULO_DAY.format(now);
}

const SAO_PAULO_MOMENT = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Um instante da API (`2026-09-22T13:05:00Z`) no fuso de São Paulo, como `22/09/2026, 10:05`; `—` sem valor. */
export function saoPauloMoment(instant: string | null): string {
  if (instant === null) return "—";

  const date = new Date(instant);

  return Number.isNaN(date.getTime()) ? "—" : SAO_PAULO_MOMENT.format(date);
}
