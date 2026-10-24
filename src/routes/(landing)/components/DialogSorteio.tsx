import {
  Button,
  Checkbox,
  ErrorMessage,
  Input,
  Label,
  Modal,
  Skeleton,
  TextField,
} from "@heroui/react";
import { Info, PartyPopper } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { getRaffleStatus, registerForRaffle } from "@/api/raffle";
import { Confetti } from "@/components/Confetti";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEmailError,
  getInstagramError,
  getPasswordError,
  getUsernameError,
  isValidEmail,
  isValidInstagram,
  isValidUsername,
  MIN_PASSWORD_LENGTH,
  normalizeInstagram,
} from "@/utils/validation";
import { PasswordField } from "@/routes/(auth)/components/PasswordField";

interface DialogSorteioProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Chamado quando a pessoa conclui a comemoração e quer seguir para o app. */
  onFinish: () => void;
  /** Chamado quando a participação fica confirmada (nova ou já existente). */
  onJoined: () => void;
}

// `signup` cria a conta, `login` entra em uma conta existente e `confirm` é
// para quem já abriu o modal com sessão: só falta o Instagram e o aceite.
type Flow = "signup" | "login" | "confirm";

const GENERIC_ERROR = "Não foi possível conectar. Tente novamente.";
const RAFFLE_ERROR =
  "Não conseguimos confirmar sua entrada no sorteio. Tente novamente.";
const SIGNUP_RAFFLE_ERROR =
  "Sua conta foi criada, mas não conseguimos confirmar sua entrada no sorteio. Tente novamente.";

const EMAIL_EXISTS_NOTICE =
  "Encontramos uma conta com esse e-mail. Digite a senha dela para entrar no sorteio.";

const FLOW_TABS: { flow: Flow; label: string }[] = [
  { flow: "signup", label: "Criar conta" },
  { flow: "login", label: "Já tenho conta" },
];

const INTRO: Record<Flow, string> = {
  signup: "Crie sua conta do Revi para concorrer. É rapidinho.",
  login: "Entre na sua conta do Revi para concorrer.",
  confirm: "Falta só o seu Instagram para entrar no sorteio.",
};

const linkClassName =
  "rounded-sm text-foreground underline underline-offset-4 outline-accent focus-visible:outline-2";

export function DialogSorteio({
  isOpen,
  onOpenChange,
  onFinish,
  onJoined,
}: DialogSorteioProps) {
  const { status, signIn, signUp } = useAuth();

  // Decidido uma vez, quando o modal abre: o status vira "authenticated" no
  // meio do cadastro e não pode trocar o formulário debaixo da pessoa.
  const [flow, setFlow] = useState<Flow | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    instagram: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    instagram: false,
    password: false,
  });
  const [consent, setConsent] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "new" comemora com confete; "already" é quem já estava inscrito.
  const [result, setResult] = useState<"new" | "already" | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  // Aviso discreto no topo do formulário (ex.: o e-mail já tinha conta).
  const [notice, setNotice] = useState<string | null>(null);

  // Fecha a janela entre dois toques antes da renderização que desabilita o
  // botão; e lembra que a conta já foi criada (ou o login feito), para um
  // retry não repetir o passo (o cadastro falharia com o e-mail já em uso) e
  // tentar só o sorteio.
  const isSubmittingRef = useRef(false);
  const accountReadyRef = useRef(false);

  useEffect(() => {
    if (!isOpen || flow !== null || status === "loading") return;

    setFlow(status === "authenticated" ? "confirm" : "signup");
  }, [isOpen, flow, status]);

  // Quem já está inscrito não precisa de formulário nenhum.
  useEffect(() => {
    if (!isOpen || flow !== "confirm") return;

    const controller = new AbortController();

    setIsChecking(true);
    getRaffleStatus(controller.signal)
      .then((raffle) => {
        if (controller.signal.aborted || !raffle.registered) return;

        setResult("already");
        onJoined();
      })
      .catch(() => {
        // Sem a resposta, o formulário segue disponível: o servidor é
        // idempotente, então inscrever de novo é seguro.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsChecking(false);
      });

    return () => controller.abort();
    // `onJoined` é estável na prática e não deve refazer a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, flow]);

  const hasCredentials =
    isValidEmail(form.email) && form.password.length >= MIN_PASSWORD_LENGTH;
  const isValid =
    isValidInstagram(form.instagram) &&
    (flow === "confirm"
      ? consent
      : flow === "login"
        ? hasCredentials && consent
        : hasCredentials && isValidUsername(form.username));

  const usernameError =
    touched.username || submitAttempted
      ? getUsernameError(form.username)
      : null;
  const emailError =
    touched.email || submitAttempted ? getEmailError(form.email) : null;
  const instagramError =
    touched.instagram || submitAttempted
      ? getInstagramError(form.instagram)
      : null;
  const passwordError =
    touched.password || submitAttempted
      ? getPasswordError(form.password)
      : null;

  function updateForm(changes: Partial<typeof form>) {
    setError(null);
    setForm((previous) => ({ ...previous, ...changes }));
  }

  function switchFlow(next: Flow, message: string | null = null) {
    setFlow(next);
    setError(null);
    setNotice(message);
    setSubmitAttempted(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitAttempted(true);

    if (!isValid || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      if (flow !== "confirm" && !accountReadyRef.current) {
        const auth =
          flow === "login"
            ? await signIn(form.email.trim(), form.password)
            : await signUp(
                form.username.trim(),
                form.email.trim(),
                form.password,
              );

        if (!auth.ok) {
          // O 409 de e-mail e o de nome de usuário têm o mesmo status; só a
          // mensagem os distingue.
          if (
            flow === "signup" &&
            auth.status === 409 &&
            /e-mail/i.test(auth.error)
          ) {
            switchFlow("login", EMAIL_EXISTS_NOTICE);
            return;
          }

          setError(auth.error);
          return;
        }

        accountReadyRef.current = true;
      }

      await registerForRaffle(normalizeInstagram(form.instagram));
      setResult("new");
      onJoined();
    } catch {
      setError(
        !accountReadyRef.current
          ? GENERIC_ERROR
          : flow === "signup"
            ? SIGNUP_RAFFLE_ERROR
            : RAFFLE_ERROR,
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  // Depois que a conta existe (ou a sessão já estava aberta), trocar de fluxo
  // não faz mais sentido.
  const canSwitch = status !== "authenticated" && flow !== "confirm";

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-100">
            <Modal.CloseTrigger />

            {result !== null ? (
              <>
                {/* z alto para o confete passar por cima do backdrop do modal. */}
                {result === "new" && <Confetti className="z-[100]" />}
                <Modal.Body className="flex flex-col items-center gap-3 py-6 text-center">
                  <img
                    src="/sucesso.webp"
                    alt=""
                    aria-hidden="true"
                    className="h-40 w-auto rounded-2xl object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                  <PartyPopper
                    aria-hidden="true"
                    className="size-10 text-accent"
                  />
                  <h1 className="text-xl font-semibold">
                    Você está participando!
                  </h1>
                  <p className="text-muted text-sm text-pretty">
                    {flow === "signup"
                      ? "Sua conta foi criada e seu nome já está no sorteio. "
                      : "Seu nome já está no sorteio. "}
                    Fique de olho no telão: se for sorteado, avisaremos por aqui
                    e pelo e-mail da sua conta.
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button className="w-full" onPress={onFinish}>
                    {status === "authenticated" && flow !== "signup"
                      ? "Ir para o Revi"
                      : "Começar a usar o Revi"}
                  </Button>
                </Modal.Footer>
              </>
            ) : (
              <>
                <Modal.Header>
                  <Modal.Icon className="bg-accent/15 text-accent">
                    <PartyPopper className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading>Entrar no sorteio</Modal.Heading>
                </Modal.Header>

                <Modal.Body>
                  {flow === null || isChecking ? (
                    <div aria-busy="true" className="flex flex-col gap-4">
                      <Skeleton className="h-10 rounded-lg" />
                      <Skeleton className="h-10 rounded-lg" />
                      <span className="sr-only">Carregando…</span>
                    </div>
                  ) : (
                    <form
                      id="form-sorteio"
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-4"
                      noValidate
                    >
                      {canSwitch && (
                        <div
                          role="tablist"
                          aria-label="Como você quer participar"
                          className="bg-default flex gap-1 rounded-xl p-1"
                        >
                          {FLOW_TABS.map((tab) => (
                            <button
                              key={tab.flow}
                              type="button"
                              role="tab"
                              aria-selected={flow === tab.flow}
                              onClick={() => {
                                if (flow !== tab.flow) switchFlow(tab.flow);
                              }}
                              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium outline-accent focus-visible:outline-2 ${
                                flow === tab.flow
                                  ? "bg-background shadow-sm"
                                  : "text-muted"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {notice !== null ? (
                        <div
                          role="status"
                          className="bg-accent/10 text-accent flex items-start gap-2 rounded-xl p-3 text-sm text-pretty"
                        >
                          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                          <p>{notice}</p>
                        </div>
                      ) : (
                        <p className="text-muted text-sm text-pretty">
                          {INTRO[flow]}
                        </p>
                      )}

                      {flow === "signup" && (
                        <TextField
                          className="w-full"
                          isInvalid={usernameError !== null}
                        >
                          <Label htmlFor="sorteio-username">
                            Nome de usuário
                          </Label>
                          <Input
                            id="sorteio-username"
                            value={form.username}
                            autoComplete="username"
                            placeholder="Como podemos te chamar?"
                            onChange={(event) =>
                              updateForm({ username: event.target.value })
                            }
                            onBlur={() =>
                              setTouched((previous) => ({
                                ...previous,
                                username: true,
                              }))
                            }
                          />
                          {usernameError ? (
                            <ErrorMessage>{usernameError}</ErrorMessage>
                          ) : null}
                        </TextField>
                      )}

                      {flow !== "confirm" && (
                        <TextField
                          className="w-full"
                          type="email"
                          isInvalid={emailError !== null}
                        >
                          <Label htmlFor="sorteio-email">E-mail</Label>
                          <Input
                            id="sorteio-email"
                            value={form.email}
                            autoComplete="email"
                            placeholder="voce@email.com"
                            onChange={(event) =>
                              updateForm({ email: event.target.value })
                            }
                            onBlur={() =>
                              setTouched((previous) => ({
                                ...previous,
                                email: true,
                              }))
                            }
                          />
                          {emailError ? (
                            <ErrorMessage>{emailError}</ErrorMessage>
                          ) : null}
                        </TextField>
                      )}

                      <TextField
                        className="w-full"
                        isInvalid={instagramError !== null}
                      >
                        <Label htmlFor="sorteio-instagram">Instagram</Label>
                        <Input
                          id="sorteio-instagram"
                          value={form.instagram}
                          autoComplete="off"
                          placeholder="@seuusuario"
                          onChange={(event) =>
                            updateForm({ instagram: event.target.value })
                          }
                          onBlur={() =>
                            setTouched((previous) => ({
                              ...previous,
                              instagram: true,
                            }))
                          }
                        />
                        {instagramError ? (
                          <ErrorMessage>{instagramError}</ErrorMessage>
                        ) : null}
                      </TextField>

                      {flow !== "confirm" && (
                        <PasswordField
                          id="sorteio-senha"
                          label="Senha"
                          value={form.password}
                          autoComplete={
                            flow === "login"
                              ? "current-password"
                              : "new-password"
                          }
                          onChange={(password) => updateForm({ password })}
                          onBlur={() =>
                            setTouched((previous) => ({
                              ...previous,
                              password: true,
                            }))
                          }
                          errorMessage={passwordError}
                          hint={
                            flow === "signup"
                              ? `No mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
                              : undefined
                          }
                        />
                      )}

                      {(flow === "login" || flow === "confirm") && (
                        <Checkbox isSelected={consent} onChange={setConsent}>
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span className="text-sm text-pretty">
                              Concordo em usar meu nome, meu e-mail e meu
                              Instagram para participar e ser contatado caso
                              seja sorteado.
                            </span>
                          </Checkbox.Content>
                        </Checkbox>
                      )}

                      {error !== null ? (
                        <p
                          role="alert"
                          className="text-danger text-sm text-pretty"
                        >
                          {error}
                        </p>
                      ) : null}

                      {flow === "signup" && (
                        /* Em nova aba de propósito: sair da tela agora
                           descartaria o que já foi digitado no formulário. */
                        <p className="text-muted text-center text-xs text-pretty">
                          Ao criar sua conta, você concorda com os{" "}
                          <Link
                            to="/termos-uso"
                            target="_blank"
                            rel="noreferrer"
                            className={linkClassName}
                          >
                            Termos de Uso
                          </Link>{" "}
                          e com a{" "}
                          <Link
                            to="/politica-privacidade"
                            target="_blank"
                            rel="noreferrer"
                            className={linkClassName}
                          >
                            Política de Privacidade
                          </Link>
                          .
                        </p>
                      )}

                    </form>
                  )}
                </Modal.Body>

                <Modal.Footer>
                  <Button
                    type="submit"
                    form="form-sorteio"
                    className="w-full"
                    isDisabled={
                      flow === null || isChecking || !isValid || isSubmitting
                    }
                  >
                    {isSubmitting ? "Entrando…" : "Participar do sorteio"}
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
