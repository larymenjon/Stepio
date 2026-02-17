import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, updateEmail } from "firebase/auth";
import { ArrowLeft, Plus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useStepioData } from "@/hooks/useStepioData";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { openSubscriptionManagement, syncEntitlements } from "@/lib/billing";
import { exportMonthlyReportPdf } from "@/utils/exportMonthlyReportPdf";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

const Account = () => {
  const { language } = useLanguage();
  const { data, loading, setUser, setChild, addChild, setActiveChild, setNotificationSettings, refreshPlan } = useStepioData();
  const navigate = useNavigate();
  const [name, setName] = useState(data.user?.name ?? "");
  const [email, setEmail] = useState(data.user?.email ?? auth.currentUser?.email ?? "");
  const [childName, setChildName] = useState(data.child?.name ?? "");
  const [childBirthDate, setChildBirthDate] = useState(data.child?.birthDate ?? "");
  const [childGender, setChildGender] = useState<'menina' | 'menino' | 'nao_informar'>(
    data.child?.gender ?? 'nao_informar'
  );
  const [notifyEvents, setNotifyEvents] = useState(data.settings?.notifyEvents ?? true);
  const [notifyMeds, setNotifyMeds] = useState(data.settings?.notifyMeds ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthDate, setNewChildBirthDate] = useState("");
  const [newChildGender, setNewChildGender] = useState<'menina' | 'menino' | 'nao_informar'>("nao_informar");

  const isPro = data.plan?.tier === "pro" && data.plan?.status === "active";
  const children = data.children.length ? data.children : data.child ? [data.child] : [];
  const canAddChild = isPro || children.length < 1;
  const genderLabel = (g?: 'menina' | 'menino' | 'nao_informar') => {
    if (g === 'menina') return byLanguage(language, 'Menina', 'Girl');
    if (g === 'menino') return byLanguage(language, 'Menino', 'Boy');
    return byLanguage(language, 'Prefiro nao dizer', 'Prefer not to say');
  };

  useEffect(() => {
    setName(data.user?.name ?? "");
    setEmail(data.user?.email ?? auth.currentUser?.email ?? "");
    setChildName(data.child?.name ?? "");
    setChildBirthDate(data.child?.birthDate ?? "");
    setChildGender(data.child?.gender ?? 'nao_informar');
    setNotifyEvents(data.settings?.notifyEvents ?? true);
    setNotifyMeds(data.settings?.notifyMeds ?? true);
  }, [data.user, data.child, data.settings]);

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{byLanguage(language, 'Carregando...', 'Loading...')}</div>
      </div>
    );
  }

  if (!data.user) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (auth.currentUser && email && email !== auth.currentUser.email) {
        try {
          await updateEmail(auth.currentUser, email);
        } catch {
          setError(byLanguage(language, 'Email nao pode ser atualizado agora. Faca login novamente e tente.', 'Email cannot be updated right now. Please log in again and try.'));
        }
      }
      setUser({
        ...data.user,
        name,
        email,
      });
      setChild({
        ...(data.child ?? { name: "", birthDate: "", condition: [] }),
        name: childName,
        birthDate: childBirthDate,
        gender: childGender,
      });
      setNotificationSettings({
        notifyEvents,
        notifyMeds,
      });
    } catch {
      setError(byLanguage(language, 'Erro ao salvar. Talvez seja preciso entrar novamente.', 'Error while saving. You may need to sign in again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mobile-container pb-24">
      <header className="stepio-header stepio-header-sm">
        <div className="stepio-header-content">
          <div className="stepio-header-card text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm"
            >
              <ArrowLeft size={16} />
              {byLanguage(language, 'Voltar ao menu', 'Back to menu')}
            </button>
            <h1 className="text-2xl font-bold">{byLanguage(language, 'Minha conta', 'My account')}</h1>
            <p className="text-muted-foreground">{byLanguage(language, 'Gerencie seus dados', 'Manage your data')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        <div className="stepio-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{byLanguage(language, 'Perfis', 'Profiles')}</p>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded-full',
                isPro ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {isPro ? 'PRO' : 'FREE'}
            </span>
          </div>
          <div className="space-y-2">
            {children.map((child) => {
              const isActive = child.id === data.activeChildId || (!data.activeChildId && data.child?.id === child.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setActiveChild(child.id)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left',
                    isActive ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">{child.name}</p>
                    <p className="text-xs text-muted-foreground">{genderLabel(child.gender)}</p>
                  </div>
                  {isActive && (
                    <span className="text-xs font-semibold text-primary">{byLanguage(language, 'Ativo', 'Active')}</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              if (canAddChild) setShowAddChild(true);
              else setShowUpgrade(true);
            }}
            className={cn(
              'w-full py-3 rounded-2xl border border-dashed font-semibold flex items-center justify-center gap-2',
              canAddChild ? 'border-primary text-primary' : 'border-border text-muted-foreground',
            )}
          >
            <Plus size={16} />
            {byLanguage(language, 'Adicionar crianca', 'Add child')}
          </button>
          {!canAddChild && (
            <p className="text-xs text-muted-foreground">
              {byLanguage(language, 'Recurso Pro: adicione mais perfis de crianca.', 'Pro feature: add more child profiles.')}
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="stepio-card space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Nome', 'Name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="stepio-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="stepio-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Nome da crianca (perfil ativo)', 'Child name (active profile)')}</label>
            <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} className="stepio-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Nascimento da crianca (perfil ativo)', 'Child birth date (active profile)')}</label>
            <input type="date" value={childBirthDate} onChange={(e) => setChildBirthDate(e.target.value)} className="stepio-input w-full" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Genero (perfil ativo)', 'Gender (active profile)')}</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'menina', label: byLanguage(language, 'Menina', 'Girl') },
                { id: 'menino', label: byLanguage(language, 'Menino', 'Boy') },
                { id: 'nao_informar', label: byLanguage(language, 'Prefiro nao dizer', 'Prefer not to say') },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setChildGender(option.id)}
                  className={cn('p-3 rounded-xl border-2 text-sm font-medium transition-all', childGender === option.id ? 'border-primary bg-primary/5' : 'border-border')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Notificacoes', 'Notifications')}</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setNotifyEvents((prev) => !prev)}
                className={cn('w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3', notifyEvents ? 'border-primary bg-primary/5' : 'border-border')}
              >
                <span className="text-sm font-medium">{byLanguage(language, 'Compromissos', 'Appointments')}</span>
                <span className="text-sm text-muted-foreground">{notifyEvents ? byLanguage(language, 'Ativado', 'Enabled') : byLanguage(language, 'Desativado', 'Disabled')}</span>
              </button>
              <button
                type="button"
                onClick={() => setNotifyMeds((prev) => !prev)}
                className={cn('w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3', notifyMeds ? 'border-primary bg-primary/5' : 'border-border')}
              >
                <span className="text-sm font-medium">{byLanguage(language, 'Remedios', 'Medications')}</span>
                <span className="text-sm text-muted-foreground">{notifyMeds ? byLanguage(language, 'Ativado', 'Enabled') : byLanguage(language, 'Desativado', 'Disabled')}</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{byLanguage(language, 'Compromissos: 1 dia e 30 min antes. Remedios: 1h e 5 min antes.', 'Appointments: 1 day and 30 min before. Medications: 1h and 5 min before.')}</p>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <button type="submit" className={cn('w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all', saving && 'opacity-70')} disabled={saving}>
            {saving ? byLanguage(language, 'Salvando...', 'Saving...') : byLanguage(language, 'Salvar alteracoes', 'Save changes')}
          </button>
        </form>

        <div className="stepio-card space-y-3">
          <p className="text-sm font-semibold">{byLanguage(language, 'Assinatura', 'Subscription')}</p>
          <p className="text-sm text-muted-foreground">
            {data.plan?.tier === 'pro' && data.plan?.status === 'active' ? byLanguage(language, 'Plano Pro ativo', 'Pro plan active') : byLanguage(language, 'Plano Free', 'Free plan')}
          </p>
          {data.plan?.tier === 'pro' && data.plan?.status === 'active' ? (
            <button type="button" onClick={openSubscriptionManagement} className={cn('w-full py-3 rounded-2xl border border-border font-bold', billingLoading && 'opacity-70')} disabled={billingLoading}>
              {billingLoading ? byLanguage(language, 'Abrindo...', 'Opening...') : byLanguage(language, 'Gerenciar assinatura', 'Manage subscription')}
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/planos')} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold">
              {byLanguage(language, 'Assinar Pro', 'Upgrade to Pro')}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              setBillingLoading(true);
              try {
                await syncEntitlements();
                await refreshPlan();
              } catch {
                setError(byLanguage(language, 'Nao foi possivel sincronizar a assinatura agora.', 'Could not sync subscription now.'));
              } finally {
                setBillingLoading(false);
              }
            }}
            className={cn('w-full py-3 rounded-2xl border border-border font-semibold', billingLoading && 'opacity-70')}
            disabled={billingLoading}
          >
            {billingLoading ? byLanguage(language, 'Sincronizando...', 'Syncing...') : byLanguage(language, 'Sincronizar assinatura', 'Sync subscription')}
          </button>
        </div>

        <div className="stepio-card space-y-3">
          <p className="text-sm font-semibold">{byLanguage(language, 'Exportar relatorio', 'Export report')}</p>
          {data.plan?.tier === 'pro' && data.plan?.status === 'active' ? (
            <button
              type="button"
              onClick={() => {
                if (!data.child) return;
                const logs = Object.values(data.dailyLogs ?? {}).filter((log) => log.childId === data.child?.id);
                const events = data.events.filter((event) => event.childId === data.child?.id);
                const milestones = data.milestones.filter((milestone) => milestone.childId === data.child?.id);
                const goals = data.therapyPlans?.[data.child.id]?.goals ?? [];
                exportMonthlyReportPdf({
                  monthDate: new Date(),
                  child: data.child,
                  user: data.user,
                  logs,
                  events,
                  milestones,
                  goals,
                });
              }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold"
            >
              {byLanguage(language, 'Exportar relatorio (PDF)', 'Export report (PDF)')}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setShowUpgrade(true)} className="w-full py-3 rounded-2xl border border-border font-bold opacity-60">
                {byLanguage(language, 'Exportar relatorio (PDF)', 'Export report (PDF)')}
              </button>
              <p className="text-xs text-muted-foreground">{byLanguage(language, 'Disponivel apenas no Plano Pro.', 'Available only on Pro plan.')}</p>
            </>
          )}
        </div>

        <button type="button" onClick={() => signOut(auth)} className="w-full py-3 rounded-2xl border border-destructive text-destructive font-bold">
          {byLanguage(language, 'Sair da conta', 'Sign out')}
        </button>
      </main>

      <BottomNav />

      {showUpgrade && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{byLanguage(language, 'Desbloqueie o Pro', 'Unlock Pro')}</h2>
              <button type="button" onClick={() => setShowUpgrade(false)} className="p-2 rounded-xl border border-border">
                {byLanguage(language, 'Fechar', 'Close')}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{byLanguage(language, 'A exportacao de relatorios e um recurso exclusivo do Plano Pro.', 'Report export is a Pro-only feature.')}</p>
            <button
              type="button"
              onClick={() => {
                setShowUpgrade(false);
                navigate('/planos');
              }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold"
            >
              {byLanguage(language, 'Ver planos', 'View plans')}
            </button>
          </div>
        </div>
      )}

      {showAddChild && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{byLanguage(language, 'Novo perfil', 'New profile')}</h2>
              <button type="button" onClick={() => setShowAddChild(false)} className="p-2 rounded-xl border border-border">
                {byLanguage(language, 'Fechar', 'Close')}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Nome da crianca', 'Child name')}</label>
                <input type="text" value={newChildName} onChange={(e) => setNewChildName(e.target.value)} className="stepio-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Nascimento', 'Birth date')}</label>
                <input type="date" value={newChildBirthDate} onChange={(e) => setNewChildBirthDate(e.target.value)} className="stepio-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Genero', 'Gender')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'menina', label: byLanguage(language, 'Menina', 'Girl') },
                    { id: 'menino', label: byLanguage(language, 'Menino', 'Boy') },
                    { id: 'nao_informar', label: byLanguage(language, 'Prefiro nao dizer', 'Prefer not to say') },
                  ] as const).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setNewChildGender(option.id)}
                      className={cn('p-3 rounded-xl border-2 text-sm font-medium transition-all', newChildGender === option.id ? 'border-primary bg-primary/5' : 'border-border')}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newChildName.trim() || !newChildBirthDate) return;
                  addChild({
                    name: newChildName.trim(),
                    birthDate: newChildBirthDate,
                    gender: newChildGender,
                    condition: [],
                  });
                  setNewChildName('');
                  setNewChildBirthDate('');
                  setNewChildGender('nao_informar');
                  setShowAddChild(false);
                }}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold"
              >
                {byLanguage(language, 'Salvar perfil', 'Save profile')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;