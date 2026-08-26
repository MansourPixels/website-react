import { createFileRoute } from "@tanstack/react-router";

import { FinalCta } from "./-landing/FinalCta";
import { Hero } from "./-landing/Hero";
import { HowItWorks } from "./-landing/HowItWorks";
import { LandingFooter } from "./-landing/LandingFooter";
import { LandingNav } from "./-landing/LandingNav";
import { Progress } from "./-landing/Progress";
import { StudyModes } from "./-landing/StudyModes";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <StudyModes />
        <Progress />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
