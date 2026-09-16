import { Button, Label, Modal, NumberField } from "@heroui/react";
import { SettingToggle } from "@/components/SettingToggle";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DEFAULT_SESSION_SETTINGS,
  SESSION_LIMITS,
  type SessionSettings,
} from "@/types/StudySession";

interface DurationFieldProps {
  label: string;
  value: number;
  limits: { min: number; max: number; step: number };
  onChange: (value: number) => void;
}

function DurationField({ label, value, limits, onChange }: DurationFieldProps) {
  return (
    <NumberField
      value={value}
      minValue={limits.min}
      maxValue={limits.max}
      step={limits.step}
      onChange={onChange}
      className="w-full"
    >
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input className="tabular-nums" />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}

interface DialogSessionSettingsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: SessionSettings;
  onSubmit: (settings: SessionSettings) => void;
  isSpotifyConnected?: boolean;
}

export function DialogSessionSettings({
  isOpen,
  onOpenChange,
  settings,
  onSubmit,
  isSpotifyConnected = false,
}: DialogSessionSettingsProps) {
  const [form, setForm] = useState<SessionSettings>(settings);

  useEffect(() => {
    if (isOpen) setForm(settings);
  }, [isOpen, settings]);

  function update(patch: Partial<SessionSettings>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleSubmit() {
    onSubmit(form);
    onOpenChange(false);
  }

  // Restaurar só reescreve o formulário: quem grava é o "Salvar", então o
  // aluno ainda pode desistir fechando o diálogo, e nada que ele editou some
  // sem aviso.
  function handleRestoreDefaults() {
    setForm(DEFAULT_SESSION_SETTINGS);
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <Settings2 className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Ajustar a sessão</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="grid gap-4">
              <DurationField
                label="Foco (minutos)"
                value={form.focusMinutes}
                limits={SESSION_LIMITS.focusMinutes}
                onChange={(focusMinutes) => update({ focusMinutes })}
              />
              <DurationField
                label="Pausa curta (minutos)"
                value={form.shortBreakMinutes}
                limits={SESSION_LIMITS.shortBreakMinutes}
                onChange={(shortBreakMinutes) => update({ shortBreakMinutes })}
              />
              <DurationField
                label="Pausa longa (minutos)"
                value={form.longBreakMinutes}
                limits={SESSION_LIMITS.longBreakMinutes}
                onChange={(longBreakMinutes) => update({ longBreakMinutes })}
              />
              <DurationField
                label="Ciclos até a pausa longa"
                value={form.cyclesUntilLongBreak}
                limits={SESSION_LIMITS.cyclesUntilLongBreak}
                onChange={(cyclesUntilLongBreak) =>
                  update({ cyclesUntilLongBreak })
                }
              />

              <SettingToggle
                label="Iniciar a próxima fase sozinho"
                isSelected={form.autoStart}
                onChange={(autoStart) => update({ autoStart })}
              />
              <SettingToggle
                label="Controlar a música do Spotify"
                description={
                  isSpotifyConnected
                    ? undefined
                    : "Disponível depois de conectar a sua conta."
                }
                isSelected={form.controlsSpotify}
                isDisabled={!isSpotifyConnected}
                onChange={(controlsSpotify) => update({ controlsSpotify })}
              />
            </Modal.Body>

            <Modal.Footer className="flex-col gap-2">
              <Button className="w-full" onPress={handleSubmit}>
                Salvar
              </Button>
              <Button
                className="w-full"
                variant="tertiary"
                onPress={handleRestoreDefaults}
              >
                Restaurar padrões
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
