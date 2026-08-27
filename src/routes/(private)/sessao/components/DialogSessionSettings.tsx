import { Button, Label, Modal, NumberField, Switch } from "@heroui/react";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  SESSION_LIMITS,
  type SessionSettings,
} from "@/types/StudySession";

interface DurationFieldProps {
  id: string;
  label: string;
  value: number;
  limits: { min: number; max: number; step: number };
  onChange: (value: number) => void;
}

function DurationField({
  id,
  label,
  value,
  limits,
  onChange,
}: DurationFieldProps) {
  return (
    <NumberField
      value={value}
      minValue={limits.min}
      maxValue={limits.max}
      step={limits.step}
      onChange={onChange}
      className="w-full"
    >
      <Label htmlFor={id}>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input id={id} className="tabular-nums" />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}

interface SettingToggleProps {
  label: string;
  description?: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onChange: (isSelected: boolean) => void;
}

function SettingToggle({
  label,
  description,
  isSelected,
  isDisabled = false,
  onChange,
}: SettingToggleProps) {
  return (
    <Switch
      isSelected={isSelected}
      isDisabled={isDisabled}
      onChange={onChange}
      className="w-full"
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <span className="flex flex-col">
          <Label>{label}</Label>
          {description ? (
            <span className="text-xs text-muted">{description}</span>
          ) : null}
        </span>
      </Switch.Content>
    </Switch>
  );
}

interface DialogSessionSettingsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: SessionSettings;
  onSubmit: (settings: SessionSettings) => void;
  onRestoreDefaults: () => void;
  isSpotifyConnected?: boolean;
}

export function DialogSessionSettings({
  isOpen,
  onOpenChange,
  settings,
  onSubmit,
  onRestoreDefaults,
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

  function handleRestoreDefaults() {
    onRestoreDefaults();
    onOpenChange(false);
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
                id="minutos-foco"
                label="Foco (minutos)"
                value={form.focusMinutes}
                limits={SESSION_LIMITS.focusMinutes}
                onChange={(focusMinutes) => update({ focusMinutes })}
              />
              <DurationField
                id="minutos-pausa-curta"
                label="Pausa curta (minutos)"
                value={form.shortBreakMinutes}
                limits={SESSION_LIMITS.shortBreakMinutes}
                onChange={(shortBreakMinutes) => update({ shortBreakMinutes })}
              />
              <DurationField
                id="minutos-pausa-longa"
                label="Pausa longa (minutos)"
                value={form.longBreakMinutes}
                limits={SESSION_LIMITS.longBreakMinutes}
                onChange={(longBreakMinutes) => update({ longBreakMinutes })}
              />
              <DurationField
                id="ciclos-pausa-longa"
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
                label="Tocar um som ao terminar a fase"
                isSelected={form.soundEnabled}
                onChange={(soundEnabled) => update({ soundEnabled })}
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
