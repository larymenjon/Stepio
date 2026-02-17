import { useMemo, useState } from "react";
import { Check, Crown } from "lucide-react";
import { openSubscriptionManagement, syncEntitlements } from "@/lib/billing";
import { useStepioData } from "@/hooks/useStepioData";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

export default function Plans() {
  const { data, refreshPlan } = useStepioData();
  const { language } = useLanguage();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const isPro = data.plan?.tier === "pro" && data.plan?.status === "active";
  const priceLabel = useMemo(() => {
    return billing === "monthly" ? byLanguage(language, "R$ 29,90 / mes", "$5.99 / month") : byLanguage(language, "R$ 286 / ano", "$59.99 / year");
  }, [billing, language]);

  const handleSync = async () => {
    setLoading(true);
    try {
      await syncEntitlements();
      await refreshPlan();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container pb-24">
      <header className="stepio-header stepio-header-sm">
        <div className="stepio-header-content">
          <div className="stepio-header-card text-left">
            <h1 className="text-2xl font-bold">{byLanguage(language, 'Planos', 'Plans')}</h1>
            <p className="text-muted-foreground">{byLanguage(language, 'Escolha o plano ideal para sua familia', 'Choose the best plan for your family')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        <div className="stepio-card space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">{byLanguage(language, 'Plano atual', 'Current plan')}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">{isPro ? "Pro" : "Free"}</p>
              <p className="text-sm text-muted-foreground">
                {isPro ? byLanguage(language, 'Assinatura ativa', 'Active subscription') : byLanguage(language, 'Sem assinatura', 'No subscription')}
              </p>
            </div>
            {isPro && (
              <button
                type="button"
                onClick={openSubscriptionManagement}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold"
              >
                {byLanguage(language, 'Gerenciar', 'Manage')}
              </button>
            )}
          </div>
        </div>

        <div className="stepio-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Free</h2>
            <span className="text-sm text-muted-foreground">{byLanguage(language, 'R$ 0', '$0')}</span>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Ate 5 terapias/consultas por mes', 'Up to 5 therapies/appointments per month')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, '1 perfil de crianca', '1 child profile')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Agenda e medicamentos', 'Schedule and medications')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Notificacoes basicas', 'Basic notifications')}</li>
          </ul>
        </div>

        <div className="stepio-card border-2 border-primary space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              <h2 className="text-lg font-bold">Pro</h2>
            </div>
            <span className="text-sm font-semibold text-primary">{priceLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn("rounded-xl border-2 px-3 py-2 text-sm font-semibold", billing === "monthly" ? "border-primary bg-primary/10" : "border-border")}
            >
              {byLanguage(language, 'Mensal', 'Monthly')}
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={cn("rounded-xl border-2 px-3 py-2 text-sm font-semibold", billing === "yearly" ? "border-primary bg-primary/10" : "border-border")}
            >
              {byLanguage(language, 'Anual', 'Yearly')}
            </button>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Terapias e consultas ilimitadas', 'Unlimited therapies and appointments')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Multi-perfis de criancas', 'Multiple child profiles')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Plano terapeutico inteligente com metas', 'Smart therapy plan with goals')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Exportar relatorios', 'Export reports')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary" />{byLanguage(language, 'Historico completo e avancado', 'Full and advanced history')}</li>
          </ul>

          <button type="button" onClick={openSubscriptionManagement} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 disabled:opacity-50">
            {byLanguage(language, 'Assinar no app', 'Subscribe in app')}
          </button>

          <button type="button" onClick={handleSync} disabled={loading} className="w-full py-3 rounded-2xl border border-border text-sm font-semibold">
            {loading ? byLanguage(language, 'Sincronizando...', 'Syncing...') : byLanguage(language, 'Sincronizar assinatura', 'Sync subscription')}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}