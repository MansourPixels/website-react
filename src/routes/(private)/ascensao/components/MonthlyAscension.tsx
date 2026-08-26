import type { AscensionMonth } from "@/mocks/ascension";
import { cn, Meter } from "@heroui/react";

interface MonthlyAscensionProps {
  months: AscensionMonth[];
}

export function MonthlyAscension({ months }: MonthlyAscensionProps) {
  const best = Math.max(...months.map((month) => month.days));

  return (
    <section className="bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-3">
      <header>
        <h2 className="font-semibold">Dias estudados por mês</h2>
        <p className="text-sm text-muted">
          Quantos dias do mês tiveram pelo menos uma sessão de estudo.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {months.map(({ label, days, totalDays }) => (
          <li
            key={label}
            className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3"
          >
            <span className="text-sm text-muted">{label}</span>
            <Meter
              value={days}
              maxValue={totalDays}
              aria-label={`${label}: ${days} de ${totalDays} dias`}
            >
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
            </Meter>
            <span
              className={cn(
                "text-sm text-right tabular-nums",
                days === best ? "font-semibold" : "text-muted",
              )}
            >
              {days} dias
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
