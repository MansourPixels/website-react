import { Button, buttonVariants } from "@heroui/react";
import { cn } from "@heroui/styles";
import { RotateCcw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

/**
 * Quem chega de uma etapa da Trilha traz o caminho de volta na URL. Só um
 * caminho interno é aceito: `//` abriria redirecionamento para fora do app.
 */
export function readReturnPath(value: string | null) {
  if (value === null) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  return value;
}

interface StudySummaryProps {
  /** Ícone do medalhão — o mesmo que identifica o modo no cartão de estudo. */
  icon: LucideIcon;
  /** Cor do medalhão: a cor da sala em que ele aparece, e nenhuma outra. */
  medallionClass: string;
  title: string;
  description: ReactNode;
  /** Slot opcional de métricas — tipicamente uma grade de `SummaryStat`. */
  metrics?: ReactNode;
  /** Conteúdo extra abaixo das métricas (a lista de correção do simulado). */
  children?: ReactNode;
  restartLabel: string;
  onRestart: () => void;
  onFinish: () => void;
}

/**
 * O fim de toda sessão de estudo tem a mesma forma: medalhão na cor do modo,
 * título, uma linha de contexto, métricas opcionais e o par
 * "Refazer / Voltar ao assunto". O que muda entre as salas é a cor, o ícone e
 * o texto — nunca o desenho.
 */
export function StudySummary({
  icon: Icon,
  medallionClass,
  title,
  description,
  metrics,
  children,
  restartLabel,
  onRestart,
  onFinish,
}: StudySummaryProps) {
  const [searchParams] = useSearchParams();
  const returnPath = readReturnPath(searchParams.get("retorno"));

  return (
    <>
      <section className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "size-20 rounded-full text-white flex items-center justify-center",
              medallionClass,
            )}
          >
            <Icon className="size-10" />
          </div>
          <h2 className="text-3xl font-semibold">{title}</h2>
          <p className="text-muted max-w-sm text-pretty">{description}</p>
        </div>

        {metrics}
        {children}
      </section>

      <footer className="flex flex-col gap-3 max-w-lg w-full mx-auto">
        <Button fullWidth size="lg" onPress={onRestart}>
          <RotateCcw />
          {restartLabel}
        </Button>
        {returnPath === null ? (
          <Button fullWidth size="lg" variant="tertiary" onPress={onFinish}>
            Voltar ao assunto
          </Button>
        ) : (
          <Link
            to={returnPath}
            className={buttonVariants({
              variant: "tertiary",
              size: "lg",
              className: "w-full",
            })}
          >
            Voltar ao plano
          </Link>
        )}
      </footer>
    </>
  );
}

interface SummaryStatProps {
  /** Imagem ou ícone acima do número; opcional. */
  media?: ReactNode;
  value: ReactNode;
  label: string;
}

/** O cartão de uma métrica dentro do slot `metrics`. */
export function SummaryStat({ media, value, label }: SummaryStatProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-surface p-4 flex flex-col items-center gap-2">
      {media}
      <strong className="text-2xl font-semibold tabular-nums">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
