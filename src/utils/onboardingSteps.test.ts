import { describe, expect, it } from "vitest";

import {
  nextStep,
  ONBOARDING_STEPS,
  resolveStep,
  stepPosition,
} from "./onboardingSteps";

describe("resolveStep", () => {
  it("cai na primeira etapa quando o slug é ausente ou desconhecido", () => {
    expect(resolveStep(null)).toBe("boas-vindas");
    expect(resolveStep("")).toBe("boas-vindas");
    expect(resolveStep("etapa-que-nao-existe")).toBe("boas-vindas");
  });

  it("aceita cada slug conhecido", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(resolveStep(step)).toBe(step);
    }
  });
});

describe("stepPosition", () => {
  it("é 1-indexado, como o rótulo da tela", () => {
    expect(stepPosition("boas-vindas")).toBe(1);
    expect(stepPosition("funcionalidades")).toBe(ONBOARDING_STEPS.length);
  });
});

describe("nextStep", () => {
  it("anda na ordem declarada", () => {
    expect(nextStep("boas-vindas")).toBe("avatar");
    expect(nextStep("avatar")).toBe("conexoes");
    expect(nextStep("conexoes")).toBe("funcionalidades");
  });

  it("devolve null na última etapa, que é o sinal de concluir", () => {
    expect(nextStep("funcionalidades")).toBeNull();
  });
});
