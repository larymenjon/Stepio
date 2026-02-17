import { Home, Pill, Calendar, Brain, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

const navItems = [
  { path: "/", icon: Home, key: "home" },
  { path: "/medicacao", icon: Pill, key: "medications" },
  { path: "/agenda", icon: Calendar, key: "agenda" },
  { path: "/terapias", icon: Brain, key: "therapies" },
  { path: "/conta", icon: User, key: "account" },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const labels: Record<(typeof navItems)[number]["key"], string> = {
    home: byLanguage(language, "Inicio", "Home"),
    medications: byLanguage(language, "Remedios", "Meds"),
    agenda: byLanguage(language, "Agenda", "Schedule"),
    therapies: byLanguage(language, "Terapias", "Therapies"),
    account: byLanguage(language, "Conta", "Account"),
  };

  return (
    <nav className="stepio-bottom-nav safe-area-inset-bottom">
      <div className="stepio-bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn("stepio-nav-item", isActive && "stepio-nav-item-active")}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-semibold">{labels[item.key]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}