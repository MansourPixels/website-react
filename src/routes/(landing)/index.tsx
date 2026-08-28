import { FinalCta } from "./components/FinalCta";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LandingFooter } from "./components/LandingFooter";
import { LandingNav } from "./components/LandingNav";
import { Progress } from "./components/Progress";
import { StudyModes } from "./components/StudyModes";
import { StudySession } from "./components/StudySession";

export default function LandingPage() {
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
      </main>
      <LandingFooter />
    </div>
  );
}
