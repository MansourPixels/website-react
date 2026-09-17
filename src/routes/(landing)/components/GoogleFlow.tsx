import {
  CalendarCheck,
  Check,
  FilePlus2,
  HardDriveDownload,
} from "lucide-react";

import { GoogleMark } from "@/components/GoogleMark";

import { ModeHeader } from "./ModeHeader";

// As duas prévias desta seção são reproduções estáticas, pelo mesmo motivo do
// MindMapPreview: a dropzone real vive no CaptureDesk e a linha de entrega no
// TarefaRow, e as duas carregam estado, diálogos e popovers que não têm o que
// fazer no bundle de uma página pública. Cada uma é embrulhada em role="img",
// porque é uma figura do produto, não um controle de mentira.
export function GoogleFlow() {
  return (
    <section
      id="google"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-8 md:px-8 lg:py-12"
    >
      <header className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Entra pelo Drive, sai para a Agenda.
        </h2>
        <p className="mt-4 leading-relaxed text-pretty text-muted">
          Uma conexão só do Google, nas duas pontas do estudo. Você libera o que
          quiser: o que ficar de fora some da tela em vez de falhar.
        </p>
      </header>

      <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-5">
        <article className="reveal flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-surface md:p-6">
          <ModeHeader
            icon={HardDriveDownload}
            iconClass="bg-accent"
            name="Do Drive para a pasta"
            description="Foto, arquivo ou PDF que já está lá"
          />

          <div
            role="img"
            aria-label="Área de envio do Revi, com a opção de arrastar um arquivo ou importar do Google Drive."
            className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
              <FilePlus2 className="size-7" />
            </span>

            <span className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-balance">
                Arraste uma foto ou um PDF
              </span>
              <span className="text-sm text-muted text-balance">
                Ou cole com Ctrl+V, ou traga o que já está no Drive.
              </span>
            </span>

            <span className="inline-flex h-10 items-center justify-center gap-2 rounded-3xl bg-default px-4 text-sm font-medium">
              <HardDriveDownload className="size-4" />
              Importar do Google Drive
            </span>
          </div>

          <p className="text-sm leading-relaxed text-pretty text-muted">
            Apresentação e documento do Google chegam convertidos em PDF. No
            celular, a mesma importação fica dentro da câmera.
          </p>
        </article>

        <div
          aria-hidden="true"
          className="flex flex-col items-center justify-center gap-3 justify-self-center lg:flex-row"
        >
          <span className="h-8 w-0 border-l lg:h-0 lg:w-10 lg:border-t lg:border-l-0" />
          <span className="flex size-12 items-center justify-center rounded-full bg-surface shadow-surface">
            <GoogleMark />
          </span>
          <span className="h-8 w-0 border-l lg:h-0 lg:w-10 lg:border-t lg:border-l-0" />
        </div>

        <article className="reveal flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-surface md:p-6">
          <ModeHeader
            icon={CalendarCheck}
            iconClass="bg-accent"
            name="Da entrega para a agenda"
            description="Lembrete 24 horas e 1 hora antes"
          />

          <div
            role="img"
            aria-label="Lista de entregas do Revi: uma tarefa de matemática já publicada na Google Agenda e uma de português concluída."
            className="flex flex-1 flex-col justify-center gap-2 rounded-2xl bg-background p-3"
          >
            <TaskPreview
              color="#388cf9"
              title="Lista de exercícios de funções"
              subject="Matemática · Função quadrática"
              deadline="Quinta, 18:00"
              isSynced
            />
            <TaskPreview
              color="#F53153"
              title="Resenha do capítulo 4"
              subject="Português · Modernismo"
              deadline="Concluída ontem"
              isDone
            />
          </div>

          <p className="text-sm leading-relaxed text-pretty text-muted">
            Publicar é sempre por clique, nunca automático. Se o evento sumir da
            sua agenda, o Revi recria em vez de duplicar.
          </p>
        </article>
      </div>
    </section>
  );
}

function TaskPreview({
  color,
  title,
  subject,
  deadline,
  isSynced = false,
  isDone = false,
}: {
  color: string;
  title: string;
  subject: string;
  deadline: string;
  isSynced?: boolean;
  isDone?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-surface flex-wrap">
      <span
        className={
          isDone
            ? "flex size-5 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
            : "size-5 shrink-0 rounded-md border-2 border-border"
        }
      >
        {isDone ? <Check className="size-3" /> : null}
      </span>

      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />

      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={
            isDone
              ? "truncate font-medium text-muted line-through"
              : "truncate font-medium"
          }
        >
          {title}
        </span>
        <span className="truncate text-xs text-muted">{subject}</span>
      </span>

      {isSynced ? (
        <CalendarCheck className="size-4 shrink-0 text-muted" />
      ) : null}

      <span className="shrink-0 text-xs text-muted tabular-nums">
        {deadline}
      </span>
    </div>
  );
}
