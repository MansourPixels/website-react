import {
  Button,
  ErrorMessage,
  Input,
  Label,
  Modal,
  TextField,
} from "@heroui/react";
import { PartyPopper } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";

import { registerForRaffle } from "@/api/raffle";
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
}

const GENERIC_ERROR = "Não foi possível conectar. Tente novamente.";
const RAFFLE_ERROR =
  "Sua conta foi criada, mas não conseguimos confirmar sua entrada no sorteio. Tente novamente.";

export function DialogSorteio({
  isOpen,
  onOpenChange,
  onFinish,
}: DialogSorteioProps) {
  const { signUp } = useAuth();

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Fecha a janela entre dois toques antes da renderização que desabilita o
  // botão; e lembra que a conta já foi criada, para um retry não repetir o
  // cadastro (que falharia com o e-mail já em uso) e tentar só o sorteio.
  const isSubmittingRef = useRef(false);
  const accountCreatedRef = useRef(false);

  const isValid =
    isValidUsername(form.username) &&
    isValidEmail(form.email) &&
    isValidInstagram(form.instagram) &&
    form.password.length >= MIN_PASSWORD_LENGTH;

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitAttempted(true);

    if (!isValid || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      if (!accountCreatedRef.current) {
        const result = await signUp(
          form.username.trim(),
          form.email.trim(),
          form.password,
        );

        if (!result.ok) {
          setError(result.error);
          return;
        }

        accountCreatedRef.current = true;
      }

      await registerForRaffle(normalizeInstagram(form.instagram));
      setCelebrating(true);
    } catch {
      setError(accountCreatedRef.current ? RAFFLE_ERROR : GENERIC_ERROR);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-100">
            <Modal.CloseTrigger />

            {celebrating ? (
              <>
                {/* z alto para o confete passar por cima do backdrop do modal. */}
                <Confetti className="z-[100]" />
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
                    Sua conta foi criada e seu nome já está no sorteio. Fique de
                    olho no telão: se for sorteado, avisaremos por aqui e pelo
                    e-mail da sua conta.
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button className="w-full" onPress={onFinish}>
                    Começar a usar o Revi
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
                  <form
                    id="form-sorteio"
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                    noValidate
                  >
                    <p className="text-muted text-sm text-pretty">
                      Crie sua conta do Revi para concorrer. É rapidinho.
                    </p>

                    <TextField
                      className="w-full"
                      isInvalid={usernameError !== null}
                    >
                      <Label htmlFor="sorteio-username">Nome de usuário</Label>
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

                    <PasswordField
                      id="sorteio-senha"
                      label="Senha"
                      value={form.password}
                      autoComplete="new-password"
                      onChange={(password) => updateForm({ password })}
                      onBlur={() =>
                        setTouched((previous) => ({
                          ...previous,
                          password: true,
                        }))
                      }
                      errorMessage={passwordError}
                      hint={`No mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
                    />

                    {error !== null ? (
                      <p role="alert" className="text-danger text-sm text-pretty">
                        {error}
                      </p>
                    ) : null}

                    {/* Em nova aba de propósito: sair da tela agora descartaria
                        o que já foi digitado no formulário. */}
                    <p className="text-muted text-center text-xs text-pretty">
                      Ao criar sua conta, você concorda com os{" "}
                      <Link
                        to="/termos-uso"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-sm text-foreground underline underline-offset-4 outline-accent focus-visible:outline-2"
                      >
                        Termos de Uso
                      </Link>{" "}
                      e com a{" "}
                      <Link
                        to="/politica-privacidade"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-sm text-foreground underline underline-offset-4 outline-accent focus-visible:outline-2"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </p>
                  </form>
                </Modal.Body>

                <Modal.Footer>
                  <Button
                    type="submit"
                    form="form-sorteio"
                    className="w-full"
                    isDisabled={!isValid || isSubmitting}
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
