import { Button, Spinner } from "@heroui/react";
import { CalendarX, HardDriveDownload, Unplug } from "lucide-react";
import { useState } from "react";

import { GoogleMark } from "@/components/GoogleMark";
import { useGoogle } from "@/contexts/GoogleContext";
import { googleIssueMessage } from "@/utils/googleIssues";

export function GoogleConnectCard() {
  const google = useGoogle();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const issueMessage = googleIssueMessage(google.issue);

  async function handleDisconnect() {
    setIsDisconnecting(true);

    try {
      await google.disconnect();
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-surface">
      <header className="flex items-center gap-3">
        <GoogleMark />
        <div className="flex min-w-0 flex-col">
          <h2 className="font-semibold">Google</h2>
          <p className="text-muted text-sm text-pretty">
            Importa material do Drive e publica as suas entregas na Agenda, para
            o lembrete tocar no celular.
          </p>
        </div>
      </header>

      {google.status === "loading" ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner size="sm" />
          Verificando a conexão…
        </p>
      ) : null}

      {google.status === "connected" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Conectado como{" "}
            <strong className="font-medium">
              {google.email ?? "sua conta Google"}
            </strong>
            .
          </p>

          {/* Consentimento parcial não é erro: o aluno pode ter desmarcado uma
              caixa de propósito. O cartão diz o que ficou de fora, e o recurso
              correspondente some em vez de falhar. */}
          {!google.hasDrive ? (
            <p className="flex items-start gap-2 text-muted text-sm text-pretty">
              <HardDriveDownload className="mt-0.5 size-4 shrink-0" />
              Sem permissão do Drive: a importação de material não aparece.
            </p>
          ) : null}

          {!google.hasCalendar ? (
            <p className="flex items-start gap-2 text-muted text-sm text-pretty">
              <CalendarX className="mt-0.5 size-4 shrink-0" />
              Sem permissão da Agenda: as tarefas ficam só dentro do Revi.
            </p>
          ) : null}

          <Button
            variant="secondary"
            className="w-full sm:w-fit"
            isPending={isDisconnecting}
            onPress={() => void handleDisconnect()}
          >
            <Unplug className="size-4" />
            Desconectar Google
          </Button>
        </div>
      ) : null}

      {google.status === "disconnected" || google.status === "connecting" ? (
        google.isConfigured ? (
          <Button
            variant="secondary"
            className="w-full sm:w-fit"
            isPending={google.status === "connecting"}
            onPress={() => void google.connect()}
          >
            Conectar Google
          </Button>
        ) : (
          <p className="text-muted text-sm">
            Configuração do Google ausente neste ambiente.
          </p>
        )
      ) : null}

      {issueMessage !== null ? (
        <p
          role="alert"
          className="text-danger-soft-foreground text-sm text-pretty"
        >
          {issueMessage}
        </p>
      ) : null}
    </section>
  );
}
