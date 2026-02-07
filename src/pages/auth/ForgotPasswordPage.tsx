import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMemo, useState } from "react";
import { useToaster } from "@/components/feedback/useToaster";
import { requestPasswordReset } from "@/domains/auth/authService";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getRedirectTo() {
  // Em dev, Vite fornece origin. Em produção, use o domínio público do app.
  return `${window.location.origin}/reset-password`;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toaster = useToaster();

  const emailError = email.length > 0 && !isEmail(email) ? "Informe um e-mail válido." : undefined;

  const redirectTo = useMemo(() => getRedirectTo(), []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Recuperar senha</h1>
      <p className="mt-1 text-sm text-muted">Enviaremos um link para redefinir sua senha.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isEmail(email)) {
            toaster.show({ title: "E-mail inválido", message: "Verifique o e-mail informado.", variant: "warning" });
            return;
          }

          setSubmitting(true);
          try {
            await requestPasswordReset(email.trim(), redirectTo);
            toaster.show({
              title: "Link enviado",
              message: "Se o e-mail existir, você receberá as instruções em instantes.",
              variant: "success"
            });
          } catch (err) {
            toaster.show({
              title: "Não foi possível enviar o link",
              message: err instanceof Error ? err.message : "Erro desconhecido",
              variant: "danger"
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          required
        />
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar link"}
        </Button>
      </form>

      <div className="mt-4 text-sm">
        <Link className="link" to="/login">
          Voltar para login
        </Link>
      </div>

      <div className="mt-6 text-xs text-muted">
        <div className="font-medium">Dica (produção)</div>
        <div className="mt-1">
          No Supabase, configure o <span className="text-fg">Site URL</span> e a lista de{" "}
          <span className="text-fg">Redirect URLs</span> para incluir:
          <div className="mt-1 code">{redirectTo}</div>
        </div>
      </div>
    </div>
  );
}
