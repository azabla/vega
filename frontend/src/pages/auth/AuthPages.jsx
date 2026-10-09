import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { FieldError, FormAlert, Input, Label } from "@/components/ui/form";
import { parseApiError } from "@/dashboard/lib/records";

const AuthShell = ({ title, description, children, footer }) => (
  <div className="relative flex min-h-dvh flex-col">
    <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
    <header className="relative flex items-center justify-between px-4 py-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2.5 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm text-primary-foreground">V</span>
        Vega
      </Link>
      <ThemeToggle />
    </header>
    <main className="relative flex flex-1 items-start justify-center px-4 pt-6 pb-12 sm:items-center sm:pt-0">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <div className="surface mt-6 p-5 sm:p-6">{children}</div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  </div>
);

const Field = ({ label, error, id, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} aria-invalid={error ? true : undefined} {...props} />
    <FieldError>{error}</FieldError>
  </div>
);

const Submit = ({ busy, children }) => (
  <Button type="submit" size="lg" className="mt-1 h-11 w-full" disabled={busy}>
    {busy && <Loader2 className="size-4 animate-spin" />}
    {children}
  </Button>
);

// Keep ?next= when switching between login and signup
const useNextQuery = () => useLocation().search;

const useAuthForm = (initial, fields, submit) => {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const bind = (name) => ({
    name,
    id: name,
    value: values[name],
    error: errors[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setErrors({});
    try {
      await submit(values); // GuestOnly redirects once the user is signed in
    } catch (error) {
      const parsed = parseApiError(error, fields.map((name) => ({ name })));
      setErrors(parsed.fieldErrors);
      setMessage(parsed.message);
      setBusy(false);
    }
  };

  return { bind, onSubmit, message, busy };
};

export const Login = () => {
  const { login } = useAuth();
  const next = useNextQuery();
  const { bind, onSubmit, message, busy } = useAuthForm({ email: "", password: "" }, ["email", "password"], login);

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to edit your portfolio."
      footer={
        <>
          New to Vega?{" "}
          <Link to={`/register${next}`} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert>{message}</FormAlert>
        <Field label="Email" type="email" autoComplete="email" required {...bind("email")} />
        <Field label="Password" type="password" autoComplete="current-password" required {...bind("password")} />
        <Submit busy={busy}>Log in</Submit>
      </form>
    </AuthShell>
  );
};

export const Register = () => {
  const { register } = useAuth();
  const next = useNextQuery();
  const { bind, onSubmit, message, busy } = useAuthForm(
    { first_name: "", last_name: "", username: "", email: "", password: "" },
    ["first_name", "last_name", "username", "email", "password"],
    register
  );
  const username = bind("username");

  return (
    <AuthShell
      title="Create your portfolio"
      description="One profile for your portfolio site, CV and more."
      footer={
        <>
          Already have an account?{" "}
          <Link to={`/login${next}`} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert>{message}</FormAlert>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" autoComplete="given-name" {...bind("first_name")} />
          <Field label="Last name" autoComplete="family-name" {...bind("last_name")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Field
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            {...username}
            onChange={(e) => username.onChange({ target: { value: e.target.value.toLowerCase() } })}
          />
          {!username.error && (
            <p className="text-xs text-muted-foreground">
              Your portfolio address: <span className="font-mono">/u/{username.value || "username"}</span>
            </p>
          )}
        </div>
        <Field label="Email" type="email" autoComplete="email" required {...bind("email")} />
        <Field label="Password" type="password" autoComplete="new-password" required minLength={8} {...bind("password")} />
        <Submit busy={busy}>Create account</Submit>
      </form>
    </AuthShell>
  );
};
