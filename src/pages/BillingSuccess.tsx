import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="mobile-container pb-24">
      <header className="stepio-header stepio-header-sm">
        <div className="stepio-header-content">
          <div className="stepio-header-card text-left">
            <h1 className="text-2xl font-bold">{byLanguage(language, 'Assinatura ativa', 'Subscription active')}</h1>
            <p className="text-muted-foreground">{byLanguage(language, 'Obrigado por apoiar o Stepio', 'Thanks for supporting Stepio')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">
        <div className="stepio-card text-center space-y-3">
          <CheckCircle2 size={44} className="text-primary mx-auto" />
          <p className="text-lg font-bold">{byLanguage(language, 'Pagamento aprovado', 'Payment approved')}</p>
          <p className="text-sm text-muted-foreground">{byLanguage(language, 'O plano Pro ja esta liberado. Aproveite os recursos avancados!', 'Your Pro plan is now active. Enjoy advanced features!')}</p>
          <button type="button" onClick={() => navigate('/')} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold">
            {byLanguage(language, 'Ir para o inicio', 'Go to home')}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}