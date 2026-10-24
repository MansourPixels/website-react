import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { resolveNextRoute } from "@/utils/authRedirect";
import { LANDING_META, pageMeta } from "@/utils/pageMeta";

import { Classrooms } from "./components/Classrooms";
import { DialogSorteio } from "./components/DialogSorteio";
import { FinalCta } from "./components/FinalCta";
import { GoogleFlow } from "./components/GoogleFlow";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LandingFooter } from "./components/LandingFooter";
import { LandingNav } from "./components/LandingNav";
import { Progress } from "./components/Progress";
import { RaffleBanner } from "./components/RaffleBanner";
import { StudyModes } from "./components/StudyModes";
import { StudySession } from "./components/StudySession";
import { Team } from "./components/Team";

export function meta() {
  return pageMeta(LANDING_META);
}

export default function LandingPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const sorteioRequested = searchParams.get("sorteio") === "true";
  const [sorteioOpen, setSorteioOpen] = useState(false);
  // Depois que o modal abre uma vez, a landing para de redirecionar sozinha:
  // quem cria a conta e fecha no X continua aqui, e só o botão "Começar a usar
  // o Revi" leva ao app (e dali ao onboarding).
  const [sorteioStarted, setSorteioStarted] = useState(false);
  // Vira true quando o modal confirma a participação (nova ou já existente).
  const [participating, setParticipating] = useState(false);

  function openSorteio() {
    setSorteioOpen(true);
    setSorteioStarted(true);
  }

  useEffect(() => {
    // Com o QR do sorteio, o modal abre para quem não tem sessão (cadastro ou
    // login) e para quem já tem (só Instagram e aceite).
    if (!sorteioRequested || status === "loading") return;

    setSorteioOpen(true);
    setSorteioStarted(true);
  }, [sorteioRequested, status]);

  useEffect(() => {
    // Com o QR do sorteio, quem já tem sessão fica para ver o modal.
    if (status !== "authenticated" || sorteioStarted || sorteioRequested) return;

    navigate(resolveNextRoute(null), { replace: true });
  }, [status, navigate, sorteioRequested, sorteioStarted]);

  function closeSorteio() {
    setSorteioOpen(false);
    // Limpa o parâmetro para um refresh (ou o efeito acima) não reabrir o modal.
    if (sorteioRequested) {
      setSearchParams(
        (previous) => {
          previous.delete("sorteio");
          return previous;
        },
        { replace: true },
      );
    }
  }

  // Mantém a landing (e o modal) montados depois do cadastro: o status vira
  // "authenticated", e sem esta ressalva a tela trocaria pelo spinner e
  // desmontaria o modal no meio da festa.
  if (status !== "unauthenticated" && !sorteioStarted) {
    return (
      <div
        className="flex flex-1 items-center justify-center p-6"
        aria-busy="true"
      >
        <Spinner size="lg" />
        <span className="sr-only">Verificando sua sessão</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <RaffleBanner
        isParticipating={participating}
        onParticipate={openSorteio}
      />
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <StudyModes />
        <StudySession />
        <GoogleFlow />
        <Progress />
        <Classrooms />
        <FinalCta />
        <Team />
      </main>
      <LandingFooter />

      <DialogSorteio
        isOpen={sorteioOpen}
        onOpenChange={(open) => {
          if (!open) closeSorteio();
        }}
        onFinish={() => navigate(resolveNextRoute(null), { replace: true })}
        onJoined={() => setParticipating(true)}
      />
    </div>
  );
}
