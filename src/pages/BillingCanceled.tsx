import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

export default function BillingCanceled() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="mobile-container pb-24">
      <header className="stepio-header stepio-header-sm">
        <div className="stepio-header-content">
          <div className="stepio-header-card text-left">
            <h1 className="text-2xl font-bold">{byLanguage(language, 'Pagamento cancelado', 'Payment canceled')}</h1>
            <p className="text-muted-foreground">{byLanguage(language, 'Sem problema, voce pode tentar novamente', 'No problem, you can try again')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">
        <div className="stepio-card text-center space-y-3">
          <XCircle size={44} className="text-destructive mx-auto" />
          <p className="text-lg font-bold">{byLanguage(language, 'Compra nao concluida', 'Purchase not completed')}</p>
          <p className="text-sm text-muted-foreground">{byLanguage(language, 'Se quiser, volte para os planos e escolha uma assinatura.', 'You can return to plans and choose a subscription.')}</p>
          <button type="button" onClick={() => navigate('/planos')} className="w-full py-3 rounded-2xl border border-border font-bold">
            {byLanguage(language, 'Ver planos', 'View plans')}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}