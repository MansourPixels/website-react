import { Button, ErrorMessage, Input, Label, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { NEXT_ROUTE_PARAM } from "@/utils/authRedirect";
import {
  getEmailError,
  getPasswordError,
  getUsernameError,
  isValidEmail,
  isValidUsername,
  MIN_PASSWORD_LENGTH,
} from "@/utils/validation";
import { PasswordField } from "../components/PasswordField";

export default function CadastroPage() {
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const nextRoute = searchParams.get(NEXT_ROUTE_PARAM);
  const signInHref =
    nextRoute === null
      ? "/auth/entrar"
      : `/auth/entrar?${NEXT_ROUTE_PARAM}=${encodeURIComponent(nextRoute)}`;

  const isValid =
    isValidUsername(form.username) &&
    isValidEmail(form.email) &&
    form.password.length >= MIN_PASSWORD_LENGTH;

  const usernameError =
    touched.username || submitAttempted
      ? getUsernameError(form.username)
      : null;
  const emailError =
    touched.email || submitAttempted ? getEmailError(form.email) : null;
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

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    const result = await signUp(form.username, form.email, form.password);

    if (!result.ok) setError(result.error);
    setIsSubmitting(false);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-muted text-sm text-pretty">
          Sua conta guarda a sua ascensão e o seu material de estudo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField className="w-full" isInvalid={usernameError !== null}>
          <Label htmlFor="username-cadastro">Nome de usuário</Label>
          <Input
            id="username-cadastro"
            value={form.username}
            autoComplete="username"
            placeholder="Como podemos te chamar?"
            onChange={(event) => updateForm({ username: event.target.value })}
            onBlur={() =>
              setTouched((previous) => ({ ...previous, username: true }))
            }
          />
          {usernameError ? <ErrorMessage>{usernameError}</ErrorMessage> : null}
        </TextField>

        <TextField
          className="w-full"
          type="email"
          isInvalid={emailError !== null}
        >
          <Label htmlFor="email-cadastro">E-mail</Label>
          <Input
            id="email-cadastro"
            value={form.email}
            autoComplete="email"
            placeholder="voce@email.com"
            onChange={(event) => updateForm({ email: event.target.value })}
            onBlur={() => setTouched((previous) => ({ ...previous, email: true }))}
          />
          {emailError ? <ErrorMessage>{emailError}</ErrorMessage> : null}
        </TextField>

        <PasswordField
          id="senha-cadastro"
          label="Senha"
          value={form.password}
          autoComplete="new-password"
          onChange={(password) => updateForm({ password })}
          onBlur={() =>
            setTouched((previous) => ({ ...previous, password: true }))
          }
          errorMessage={passwordError}
          hint={`No mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
        />

        {error !== null ? (
          <p role="alert" className="text-danger text-sm text-pretty">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          isDisabled={!isValid || isSubmitting}
        >
          Criar conta
        </Button>
      </form>

      <p className="text-muted text-center text-sm">
        Já tem uma conta?{" "}
        <Link
          to={signInHref}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-accent",
          })}
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
