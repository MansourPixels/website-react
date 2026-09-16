import {
  Button,
  Input,
  Label,
  Modal,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { Check, Copy, Link2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { createInviteLink, inviteByUsername } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomInvite, ClassroomRole } from "@/types/api/classroom";
import { roleDescription, roleLabel } from "@/utils/classroomPermissions";

type InvitableRole = Exclude<ClassroomRole, "owner">;

const roles: InvitableRole[] = ["viewer", "editor"];

interface DialogInviteMemberProps {
  classroomId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Só quem exibe a lista de convites precisa disto. */
  onInvited?: (invite: ClassroomInvite) => void;
}

function RolePicker({
  value,
  onChange,
}: {
  value: InvitableRole;
  onChange: (role: InvitableRole) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label>Permissão na turma</Label>
      <ToggleButtonGroup
        fullWidth
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const [next] = keys;

          if (next !== undefined) onChange(next as InvitableRole);
        }}
      >
        {roles.map((role) => (
          <ToggleButton key={role} id={role} className="flex-1">
            {roleLabel(role)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <p className="text-muted text-xs text-pretty">{roleDescription(value)}</p>
    </div>
  );
}

export function DialogInviteMember({
  classroomId,
  isOpen,
  onOpenChange,
  onInvited,
}: DialogInviteMemberProps) {
  // O molde dos diálogos põe a ação no rodapé — com abas, o rodapé precisa
  // saber qual delas está aberta.
  const [tab, setTab] = useState<"username" | "link">("username");
  const [username, setUsername] = useState("");
  const [usernameRole, setUsernameRole] = useState<InvitableRole>("viewer");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const [linkRole, setLinkRole] = useState<InvitableRole>("viewer");
  const [link, setLink] = useState<ClassroomInvite | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const feedback = useFeedback();

  useEffect(() => {
    if (!isOpen) return;

    setTab("username");
    setUsername("");
    setUsernameError(null);
    setUsernameSuccess(null);
    setLink(null);
    setLinkError(null);
    setIsCopied(false);
  }, [isOpen]);

  async function handleInviteByUsername() {
    const trimmed = username.trim().replace(/^@/, "");

    if (trimmed.length === 0 || isInviting) return;

    setIsInviting(true);
    setUsernameError(null);
    setUsernameSuccess(null);

    try {
      const invite = await inviteByUsername(
        classroomId,
        trimmed,
        usernameRole,
      );

      feedback("sucesso");
      setUsername("");
      setUsernameSuccess(`Convite enviado para @${trimmed}.`);
      onInvited?.(invite);
    } catch (apiError) {
      feedback("erro");
      setUsernameError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível enviar o convite. Tente novamente.",
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function handleGenerateLink() {
    if (isGenerating) return;

    setIsGenerating(true);
    setLinkError(null);
    setIsCopied(false);

    try {
      const invite = await createInviteLink(classroomId, linkRole);

      feedback("sucesso");
      setLink(invite);
      onInvited?.(invite);
    } catch (apiError) {
      feedback("erro");
      setLinkError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível gerar o link. Tente novamente.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const inviteUrl =
    link === null
      ? ""
      : `${typeof window === "undefined" ? "" : window.location.origin}/turmas/convite/${link.code}`;

  async function handleCopy() {
    if (link === null) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
    } catch {
      // Sem permissão de área de transferência: o link continua visível na
      // tela para ser copiado à mão.
      setLinkError("Copie o link manualmente do campo acima.");
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-100">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <UserPlus className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Convidar para a turma</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <Tabs
                selectedKey={tab}
                onSelectionChange={(key) =>
                  setTab(key as "username" | "link")
                }
              >
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Formas de convidar">
                    <Tabs.Tab id="username">
                      Por username
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="link">
                      Por link
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>

                <Tabs.Panel id="username" className="flex flex-col gap-4 pt-4">
                  <TextField className="w-full">
                    <Label htmlFor="username-convite">Username</Label>
                    <Input
                      id="username-convite"
                      placeholder="ana.souza"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </TextField>

                  <RolePicker value={usernameRole} onChange={setUsernameRole} />

                  {usernameSuccess !== null ? (
                    <p role="status" className="text-success text-sm text-pretty">
                      {usernameSuccess}
                    </p>
                  ) : null}
                  {usernameError !== null ? (
                    <p role="alert" className="text-danger text-sm text-pretty">
                      {usernameError}
                    </p>
                  ) : null}
                </Tabs.Panel>

                <Tabs.Panel id="link" className="flex flex-col gap-4 pt-4">
                  <RolePicker value={linkRole} onChange={setLinkRole} />

                  {link !== null ? (
                    <div className="flex flex-col gap-2">
                      <TextField className="w-full">
                        <Label htmlFor="link-convite">Link para compartilhar</Label>
                        <Input id="link-convite" readOnly value={inviteUrl} />
                      </TextField>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted text-xs">
                          Código:{" "}
                          <strong className="font-medium">{link.code}</strong>
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={handleCopy}
                        >
                          {isCopied ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                          {isCopied ? "Copiado" : "Copiar"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {linkError !== null ? (
                    <p role="alert" className="text-danger text-sm text-pretty">
                      {linkError}
                    </p>
                  ) : null}
                </Tabs.Panel>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              {tab === "username" ? (
                <Button
                  className="w-full"
                  isDisabled={username.trim().length === 0 || isInviting}
                  onPress={handleInviteByUsername}
                >
                  {isInviting ? "Enviando…" : "Enviar convite"}
                </Button>
              ) : (
                <Button
                  variant={link === null ? "primary" : "secondary"}
                  className="w-full"
                  isDisabled={isGenerating}
                  onPress={handleGenerateLink}
                >
                  <Link2 className="size-4" />
                  {isGenerating
                    ? "Gerando…"
                    : link === null
                      ? "Gerar link de convite"
                      : "Gerar outro link"}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
