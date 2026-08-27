import { Button, Input, Label, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useState } from "react";
import { Link } from "react-router";

import { forgotPassword } from "@/api/auth";
import { isValidEmail } from "@/utils/validation";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isValid = isValidEmail(email);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    // A API sempre responde 202, mesmo se o e-mail não existir — nunca
    // revela se uma conta está cadastrada, então a UI mostra a mesma
    // mensagem de sucesso independentemente do resultado.
    try {
      await forgotPassword(email);
    } finally {
      setIsSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Verifique seu e-mail</h1>
          <p className="text-muted text-sm text-pretty">
            Se houver uma conta cadastrada com esse e-mail, enviamos um link
            para redefinir sua senha.
          </p>
        </div>

        <Link
          to="/auth/entrar"
          className={buttonVariants({ className: "w-full" })}
        >
          Voltar para o login
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Esqueci minha senha</h1>
        <p className="text-muted text-sm text-pretty">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField className="w-full" type="email">
          <Label htmlFor="email-esqueci-senha">E-mail</Label>
          <Input
            id="email-esqueci-senha"
            value={email}
            autoComplete="email"
            placeholder="voce@email.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </TextField>

        <Button
          type="submit"
          className="w-full"
          isDisabled={!isValid || isSubmitting}
        >
          Enviar link de redefinição
        </Button>
      </form>

      <p className="text-muted text-center text-sm">
        <Link
          to="/auth/entrar"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-accent",
          })}
        >
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
