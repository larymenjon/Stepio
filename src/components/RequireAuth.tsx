import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{byLanguage(language, "Carregando...", "Loading...")}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}