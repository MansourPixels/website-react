import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { ApiError } from "@/api/client";
import { updateAvatar } from "@/api/user";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogle } from "@/contexts/GoogleContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useSpotify } from "@/contexts/SpotifyContext";
import { useFeedback } from "@/hooks/useFeedback";
import { NEXT_ROUTE_PARAM, resolveNextRoute } from "@/utils/authRedirect";
import { buildAvatarUrl, randomAvatarConfig, type AvatarConfig } from "@/utils/avatar";
import {
  nextStep,
  ONBOARDING_STEPS,
  ONBOARDING_STEP_LABELS,
  resolveStep,
  STEP_PARAM,
  stepPosition,
} from "@/utils/onboardingSteps";
import { pageMeta } from "@/utils/pageMeta";
import { OnboardingSpine } from "./components/OnboardingSpine";
import { StepAvatar } from "./components/StepAvatar";
import { StepBoasVindas } from "./components/StepBoasVindas";
import { StepConexoes } from "./components/StepConexoes";
import { StepFuncionalidades } from "./components/StepFuncionalidades";

export function meta() {
  return pageMeta({
    title: "Primeiros passos",
    description:
      "Escolha o seu avatar, conheça as funcionalidades e conecte as suas contas antes de começar a estudar.",
  });
}

export default function OnboardingRoute() {
  // A rota mora fora do layout de `(private)` para não passar pelo
  // `RequireOnboarding` — que é o gate que existe por causa dela. A exigência
  // de sessão, porém, continua valendo, então o `RequireAuth` entra aqui.
  return (
    <RequireAuth>
      <OnboardingPage />
    </RequireAuth>
  );
}

function OnboardingPage() {
  const { user } = useAuth();
  const { complete } = useOnboarding();
  const navigate = useNavigate();
  const feedback = useFeedback();
  const spotify = useSpotify();
  const google = useGoogle();

  const [searchParams, setSearchParams] = useSearchParams();

  const step = resolveStep(searchParams.get(STEP_PARAM));
  const position = stepPosition(step);

  // Onde o aluno queria chegar antes de o gate interceptá-lo. O guarda contra
  // `/onboarding` evita o laço de um salto se alguém montar esse link à mão.
  const requestedNext = resolveNextRoute(searchParams.get(NEXT_ROUTE_PARAM));
  const finalRoute = requestedNext.startsWith("/onboarding")
    ? "/capturar"
    : requestedNext;

  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // `randomAvatarConfig` sorteia, então não pode rodar durante o render: o app
  // é pré-renderizado e o HTML do servidor divergiria do da hidratação.
  useEffect(() => {
    setConfig((current) => current ?? randomAvatarConfig());
  }, []);

  // Sem as chaves no ambiente a etapa de conexões só saberia dizer
  // "configuração ausente": melhor não existir do que existir vazia.
  const hasConnections = spotify.isConfigured || google.isConfigured;

  // `advance` e `skip` já saltam a etapa, mas dá para cair nela de lado — pelo
  // Voltar do navegador ou por um link com `?passo=conexoes` na mão.
  useEffect(() => {
    if (step !== "conexoes" || hasConnections) return;

    const params = new URLSearchParams(searchParams);

    params.set(STEP_PARAM, "funcionalidades");
    setSearchParams(params, { replace: true });
  }, [step, hasConnections, searchParams, setSearchParams]);

  function goTo(target: string) {
    const params = new URLSearchParams(searchParams);

    params.set(STEP_PARAM, target);

    // `replace` para o Voltar do Android não percorrer as quatro etapas de trás
    // para frente antes de sair do onboarding.
    setSearchParams(params, { replace: true });
  }

  async function finish() {
    await complete();
    feedback("conquista");
    navigate(finalRoute, { replace: true });
  }

  async function advance() {
    if (isAdvancing) return;

    setIsAdvancing(true);
    setAvatarError(null);

    try {
      // O avatar é gravado ao sair da etapa, não no fim do fluxo: o redirect de
      // página inteira do Spotify, na etapa seguinte, derrubaria o estado em
      // memória e a escolha se perderia.
      if (step === "avatar" && config !== null) {
        await updateAvatar(buildAvatarUrl(config));
      }
    } catch (error) {
      feedback("erro");
      setAvatarError(
        error instanceof ApiError
          ? error.detail
          : "Não foi possível salvar o avatar. Tente novamente.",
      );
      setIsAdvancing(false);

      return;
    }

    let target = nextStep(step);

    if (target === "conexoes" && !hasConnections) target = nextStep(target);

    if (target === null) {
      await finish();
    } else {
      goTo(target);
    }

    setIsAdvancing(false);
  }

  function skip() {
    let target = nextStep(step);

    if (target === "conexoes" && !hasConnections) target = nextStep(target);

    if (target === null) {
      void finish();
    } else {
      goTo(target);
    }
  }

  const isLast = nextStep(step) === null;
  const canSkip = step === "avatar" || step === "conexoes";

  const primaryLabel = isLast
    ? "Começar a estudar"
    : step === "boas-vindas"
      ? "Começar"
      : step === "avatar"
        ? "Salvar e continuar"
        : "Continuar";

  if (user === null) return null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 p-6">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-full outline-accent outline-offset-4 focus-visible:outline-2"
      >
        <img src="/logo.svg" alt="" className="size-8" />
        <span className="text-lg font-semibold">Revi</span>
        <span className="sr-only">Voltar para a página inicial</span>
      </Link>

      <OnboardingSpine
        position={position}
        total={ONBOARDING_STEPS.length}
        label={ONBOARDING_STEP_LABELS[step]}
      />

      {/* `key` remonta o painel a cada etapa, e é isso que redispara a animação
          de entrada por `@starting-style` do `.celebrate-stagger`. */}
      <section
        key={step}
        className="celebrate-stagger flex w-full flex-col gap-6 rounded-3xl bg-surface p-6 shadow-surface"
      >
        {step === "boas-vindas" ? (
          <StepBoasVindas username={user.username} />
        ) : null}

        {step === "avatar" ? (
          <StepAvatar
            config={config}
            onChange={(changes) =>
              setConfig((current) =>
                current === null ? current : { ...current, ...changes },
              )
            }
            onReplace={setConfig}
            error={avatarError}
          />
        ) : null}

        {step === "conexoes" ? (
          // O caminho de volta sai dos parâmetros reais, nunca de uma string
          // fixa: um literal perderia o `?proximo=` e o fim do fluxo jogaria o
          // aluno em `/capturar` em vez do destino que ele pediu.
          <StepConexoes
            returnTo={`/onboarding?${searchParams.toString()}`}
          />
        ) : null}

        {step === "funcionalidades" ? <StepFuncionalidades /> : null}
      </section>

      <div className="flex w-full flex-col gap-2 sm:flex-row-reverse">
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:flex-1"
          isPending={isAdvancing}
          onPress={() => void advance()}
        >
          {primaryLabel}
        </Button>

        {canSkip ? (
          <Button variant="ghost" size="lg" className="w-full sm:w-fit" onPress={skip}>
            Pular
          </Button>
        ) : null}
      </div>
    </main>
  );
}
