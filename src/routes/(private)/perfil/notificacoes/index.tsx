import { Skeleton } from "@heroui/react";
import { useEffect, useState } from "react";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/api/notifications";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import { SettingToggle } from "@/components/SettingToggle";
import { useFeedback } from "@/hooks/useFeedback";
import type {
  NotificationCategoryKey,
  NotificationPreferences,
} from "@/types/api/notifications";
import {
  CATEGORY_COPY,
  CATEGORY_KEYS,
  withChange,
} from "@/utils/notificationPreferences";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Notificações por e-mail",
    description:
      "Escolha quais tipos de e-mail do Revi você quer receber: amizades, turmas, tarefas e lembretes de prazo.",
  });
}

export default function NotificacoesPage() {
  const feedback = useFeedback();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Um pedido por interruptor de cada vez: só a chave em andamento fica
  // desabilitada, as outras continuam livres.
  const [pendingKeys, setPendingKeys] = useState<
    ReadonlySet<NotificationCategoryKey>
  >(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getNotificationPreferences(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPreferences(result);
      })
      .catch(() => {
        // Ao desmontar, o próprio cancelamento rejeita a promise: não é falha.
        if (controller.signal.aborted) return;

        setLoadError("Não foi possível carregar as suas preferências.");
      });

    return () => controller.abort();
  }, [reloadKey]);

  function handleRetry() {
    setPreferences(null);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  function setPending(key: NotificationCategoryKey, isPending: boolean) {
    setPendingKeys((current) => {
      const next = new Set(current);

      if (isPending) next.add(key);
      else next.delete(key);

      return next;
    });
  }

  async function handleChange(key: NotificationCategoryKey, value: boolean) {
    // O interruptor muda na hora; o valor anterior é o oposto do novo, sem
    // depender do estado que esta closure capturou.
    setPreferences((current) =>
      current === null ? current : withChange(current, key, value),
    );
    setPending(key, true);
    setSaveError(null);

    try {
      // Só a chave alterada viaja.
      const saved = await updateNotificationPreferences({ [key]: value });

      // E só o valor dela é aplicado: respostas de dois interruptores podem
      // chegar fora de ordem, e uma resposta mais antiga, tomada inteira,
      // desfaria a mudança otimista da outra chave.
      setPreferences((current) =>
        current === null ? current : withChange(current, key, saved[key]),
      );
    } catch {
      feedback("erro");
      setPreferences((current) =>
        current === null ? current : withChange(current, key, !value),
      );
      setSaveError(
        `Não foi possível atualizar "${CATEGORY_COPY[key].label}". Tente novamente.`,
      );
    } finally {
      setPending(key, false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Notificações por e-mail" hasBackButton backHref="/perfil" />

      {loadError !== null ? (
        <ErrorState onRetry={handleRetry}>{loadError}</ErrorState>
      ) : preferences === null ? (
        <section
          aria-busy="true"
          className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-surface"
        >
          {CATEGORY_KEYS.map((key) => (
            <Skeleton key={key} className="h-10 rounded-lg" />
          ))}
          <span className="sr-only">Carregando as suas preferências…</span>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-surface">
          <header className="flex flex-col gap-1">
            <h2 className="font-semibold">Quais e-mails você quer receber</h2>
            <p className="text-xs text-muted text-balance">
              Cada mudança vale na hora. Você também pode desligar um tipo pelo
              link no fim de cada e-mail.
            </p>
          </header>

          {CATEGORY_KEYS.map((key) => (
            <SettingToggle
              key={key}
              label={CATEGORY_COPY[key].label}
              description={CATEGORY_COPY[key].description}
              isSelected={preferences[key]}
              isDisabled={pendingKeys.has(key)}
              onChange={(value) => void handleChange(key, value)}
            />
          ))}

          {saveError !== null ? (
            <p
              role="alert"
              className="text-danger-soft-foreground text-sm text-pretty"
            >
              {saveError}
            </p>
          ) : null}

          <p className="text-muted text-xs text-pretty">
            Os e-mails de confirmação da conta e de redefinição de senha
            continuam sendo enviados.
          </p>
        </section>
      )}
    </main>
  );
}
