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
