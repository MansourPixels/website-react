import { Spinner } from "@heroui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { resolveNextRoute } from "@/utils/authRedirect";

import { FinalCta } from "./components/FinalCta";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LandingFooter } from "./components/LandingFooter";
import { LandingNav } from "./components/LandingNav";
import { Progress } from "./components/Progress";
import { StudyModes } from "./components/StudyModes";
import { StudySession } from "./components/StudySession";
import { Team } from "./components/Team";

export default function LandingPage() {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status !== "authenticated") return;

    navigate(resolveNextRoute(null), { replace: true });
  }, [status, navigate]);

  if (status !== "unauthenticated") {
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
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <StudyModes />
        <StudySession />
        <Progress />
        <FinalCta />
        <Team />
      </main>
      <LandingFooter />
    </div>
  );
}
