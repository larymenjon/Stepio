import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { FirebaseError } from "firebase/app";

const Login = () => {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof FirebaseError) {
        const code = err.code;
        if (code === "auth/invalid-email") {
          setError(t("auth.errorInvalidEmail"));
        } else if (code === "auth/weak-password") {
          setError(t("auth.errorWeakPassword"));
        } else if (code === "auth/email-already-in-use") {
          setError(t("auth.errorEmailInUse"));
        } else if (code === "auth/unauthorized-domain") {
          setError(t("auth.errorUnauthorizedDomain"));
        } else if (code === "auth/invalid-api-key") {
          setError(t("auth.errorInvalidApiKey"));
        } else {
          setError(`Error: ${code}`);
        }
      } else {
        setError(t("auth.errorUnexpected"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md stepio-card">
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{t("auth.language")}:</span>
          <button
            type="button"
            onClick={() => setLanguage("pt-BR")}
            className={cn(
              "rounded-lg border px-2 py-1 text-xs font-semibold transition-colors",
              language === "pt-BR"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground",
            )}
          >
            PT
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={cn(
              "rounded-lg border px-2 py-1 text-xs font-semibold transition-colors",
              language === "en"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground",
            )}
          >
            EN
          </button>
        </div>

        <h1 className="mb-2 text-2xl font-bold">
          {mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === "login" ? t("auth.loginDescription") : t("auth.registerDescription")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-2 block text-sm font-semibold">{t("auth.name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="stepio-input w-full"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold">{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="stepio-input w-full"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">{t("auth.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="stepio-input w-full"
              required
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <button
            type="submit"
            className={cn(
              "w-full rounded-2xl bg-primary py-3 text-lg font-bold text-primary-foreground transition-all",
              loading && "opacity-70",
            )}
            disabled={loading}
          >
            {loading ? t("auth.loading") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-sm font-semibold text-primary"
        >
          {mode === "login" ? t("auth.wantCreateAccount") : t("auth.alreadyHaveAccount")}
        </button>
      </div>
    </div>
  );
};

export default Login;