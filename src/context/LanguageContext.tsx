import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AppLanguage } from "@/i18n";

type Translations = Record<AppLanguage, Record<string, string>>;

const STORAGE_KEY = "stepio.language";

const translations: Translations = {
  "pt-BR": {
    "auth.signIn": "Entrar",
    "auth.createAccount": "Criar conta",
    "auth.loginDescription": "Acesse sua conta para continuar.",
    "auth.registerDescription": "Crie sua conta para comecar a jornada.",
    "auth.name": "Nome",
    "auth.email": "Email",
    "auth.password": "Senha",
    "auth.loading": "Carregando...",
    "auth.wantCreateAccount": "Quero criar uma conta",
    "auth.alreadyHaveAccount": "Ja tenho uma conta",
    "auth.errorInvalidEmail": "Email invalido.",
    "auth.errorWeakPassword": "Senha fraca. Use pelo menos 6 caracteres.",
    "auth.errorEmailInUse": "Este email ja esta em uso.",
    "auth.errorUnauthorizedDomain": "Dominio nao autorizado no Firebase.",
    "auth.errorInvalidApiKey": "Chave do Firebase invalida (confira o .env).",
    "auth.errorUnexpected": "Erro inesperado. Verifique seus dados e tente novamente.",
    "auth.language": "Idioma",
  },
  en: {
    "auth.signIn": "Sign in",
    "auth.createAccount": "Create account",
    "auth.loginDescription": "Access your account to continue.",
    "auth.registerDescription": "Create your account to start the journey.",
    "auth.name": "Name",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.loading": "Loading...",
    "auth.wantCreateAccount": "I want to create an account",
    "auth.alreadyHaveAccount": "I already have an account",
    "auth.errorInvalidEmail": "Invalid email.",
    "auth.errorWeakPassword": "Weak password. Use at least 6 characters.",
    "auth.errorEmailInUse": "This email is already in use.",
    "auth.errorUnauthorizedDomain": "Unauthorized domain in Firebase.",
    "auth.errorInvalidApiKey": "Invalid Firebase key (check your .env).",
    "auth.errorUnexpected": "Unexpected error. Check your data and try again.",
    "auth.language": "Language",
  },
};

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function detectDefaultLanguage(): AppLanguage {
  if (typeof window === "undefined") return "pt-BR";

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  if (savedLanguage === "pt-BR" || savedLanguage === "en") {
    return savedLanguage;
  }

  const browserLanguage = navigator.languages?.[0] ?? navigator.language ?? "";
  return browserLanguage.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(detectDefaultLanguage);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => translations[language][key] ?? key,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
