function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function formatUploadDate(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) return "";

  const days = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );

  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days > 1 && days < 7) return `há ${days} dias`;

  return date.toLocaleDateString("pt-BR");
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;

  return `${hours}h ${rest}min`;
}

// Literais em vez de `toLocaleDateString("pt-BR", { weekday: "short" })`: o ICU
// devolve "sex." em alguns runtimes e "sex" em outros, e o mesmo prazo não pode
// mudar de forma conforme o aparelho. Mesma escolha do calendário da Ascensão.
const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * O prazo de uma tarefa, sempre relativo a agora.
 *
 * "hoje, 23:59" · "amanhã, 14:00" · "sex, 12/09 · 18:00" · "atrasada há 2 dias"
 */
export function formatDueDate(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

  if (date.getTime() < now.getTime()) {
    // Vencido hoje ainda é "hoje" no calendário, mas já passou no relógio — e é
    // o relógio que importa para uma entrega.
    if (days === 0) return `atrasada desde ${time}`;
    if (days === -1) return "atrasada desde ontem";

    return `atrasada há ${Math.abs(days)} dias`;
  }

  if (days === 0) return `hoje, ${time}`;
  if (days === 1) return `amanhã, ${time}`;

  const dayMonth = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;

  if (days < 7) {
    return `${WEEKDAY_LABELS[date.getDay()]}, ${dayMonth} · ${time}`;
  }

  return `${dayMonth}/${date.getFullYear()} · ${time}`;
}
