import { Button, ErrorMessage, Input, Label, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { NEXT_ROUTE_PARAM } from "@/utils/authRedirect";
import { pageMeta } from "@/utils/pageMeta";
import {
  getEmailError,
  getPasswordError,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
} from "../../../utils/validation";
import { PasswordField } from "../components/PasswordField";

export function meta() {
  return pageMeta({
    title: "Entrar",
    description:
      "Entre na sua conta para retomar as suas pastas, a sua trilha de estudos e as suas turmas.",
  });
}

export default function EntrarPage() {
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const nextRoute = searchParams.get(NEXT_ROUTE_PARAM);
  const signUpHref =
    nextRoute === null
      ? "/auth/cadastro"
      : `/auth/cadastro?${NEXT_ROUTE_PARAM}=${encodeURIComponent(nextRoute)}`;

  const isValid =
    isValidEmail(form.email) && form.password.length >= MIN_PASSWORD_LENGTH;

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitAttempted(true);

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    const result = await signIn(form.email, form.password);

    if (!result.ok) setError(result.error);
    setIsSubmitting(false);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-muted text-sm text-pretty">
          Acesse sua conta para continuar de onde parou.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          className="w-full"
          type="email"
          isInvalid={emailError !== null}
        >
          <Label htmlFor="email-login">E-mail</Label>
          <Input
            id="email-login"
            value={form.email}
            autoComplete="email"
            placeholder="voce@email.com"
            onChange={(event) => updateForm({ email: event.target.value })}
            onBlur={() => setTouched((previous) => ({ ...previous, email: true }))}
          />
          {emailError ? <ErrorMessage>{emailError}</ErrorMessage> : null}
        </TextField>

        <PasswordField
          id="senha-login"
          label="Senha"
          value={form.password}
          onChange={(password) => updateForm({ password })}
          onBlur={() =>
            setTouched((previous) => ({ ...previous, password: true }))
          }
          errorMessage={passwordError}
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
          Entrar
        </Button>
      </form>

      <p className="text-muted text-center text-sm">
        <Link
          to="/auth/esqueci-senha"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-accent",
          })}
        >
          Esqueci minha senha
        </Link>
      </p>

      <p className="text-muted text-center text-sm">
        Ainda não tem conta?{" "}
        <Link
          to={signUpHref}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-accent",
          })}
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}
