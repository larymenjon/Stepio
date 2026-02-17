import { useMemo, useState } from "react";
import { Plus, Brain, Stethoscope, X } from "lucide-react";
import { Event } from "@/types/stepio";
import { format, parseISO, isAfter, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useStepioData } from "@/hooks/useStepioData";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage, getDateLocale, getEventTypeLabel } from "@/i18n";

interface TerapiasProps {
  events: Event[];
  onAdd: (event: Omit<Event, "id" | "childId">) => void;
  onDelete: (id: string) => void;
}

const eventIcons = {
  therapy: Brain,
  doctor: Stethoscope,
};

const eventColors = {
  therapy: "bg-purple-100 text-purple-700 border-purple-200",
  doctor: "bg-blue-100 text-blue-700 border-blue-200",
};

const allowedTypes: Event["type"][] = ["therapy", "doctor"];

export function Terapias({ events, onAdd, onDelete }: TerapiasProps) {
  const { language } = useLanguage();
  const { data } = useStepioData();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    professional: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    type: "therapy" as Event["type"],
  });

  const sortedEvents = [...events]
    .filter((event) => allowedTypes.includes(event.type))
    .sort((a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime());

  const currentMonthCount = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return sortedEvents.filter((event) =>
      isWithinInterval(parseISO(event.datetime), { start, end })
    ).length;
  }, [sortedEvents]);

  const isPro = data.plan?.tier === "pro" && data.plan?.status === "active";
  const limitReached = !isPro && currentMonthCount >= 5;

  const upcoming = sortedEvents.filter((event) => isAfter(parseISO(event.datetime), new Date()));
  const past = sortedEvents.filter((event) => !isAfter(parseISO(event.datetime), new Date()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title) {
      const datetime = `${formData.date}T${formData.time}:00`;
      onAdd({
        title: formData.title,
        professional: formData.professional || undefined,
        datetime,
        type: formData.type,
      });
      setFormData({
        title: "",
        professional: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        type: "therapy",
      });
      setShowForm(false);
    }
  };

  return (
    <div className="pb-24">
      <header className="stepio-header stepio-header-sm">
        <div className="stepio-header-content">
          <div className="stepio-header-card text-center">
            <h1 className="text-2xl font-bold">{byLanguage(language, 'Terapias e consultas', 'Therapies and appointments')}</h1>
            <p className="text-muted-foreground">{byLanguage(language, 'Adicione e acompanhe os compromissos do seu filho', "Add and track your child's appointments")}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="stepio-card text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">{byLanguage(language, 'Nenhuma terapia cadastrada', 'No therapies added')}</p>
            <p className="text-sm text-muted-foreground">{byLanguage(language, 'Toque no + para adicionar', 'Tap + to add')}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-muted-foreground">{byLanguage(language, 'Proximas', 'Upcoming')}</h3>
                {upcoming.map((event) => {
                  const Icon = eventIcons[event.type as "therapy" | "doctor"];
                  const colorClass = eventColors[event.type as "therapy" | "doctor"];
                  return (
                    <div key={event.id} className={cn("stepio-card border-l-4", colorClass)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{event.title}</p>
                          {event.professional && (
                            <p className="text-sm opacity-80">{event.professional}</p>
                          )}
                          <p className="text-sm font-medium">
                            {format(parseISO(event.datetime), language === 'en' ? "MMM dd 'at' HH:mm" : "dd 'de' MMMM 'as' HH:mm", { locale: getDateLocale(language) })}
                          </p>
                        </div>
                        <button
                          onClick={() => onDelete(event.id)}
                          className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {past.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-muted-foreground">{byLanguage(language, 'Passadas', 'Past')}</h3>
                {past.map((event) => {
                  const Icon = eventIcons[event.type as "therapy" | "doctor"];
                  const colorClass = eventColors[event.type as "therapy" | "doctor"];
                  return (
                    <div key={event.id} className={cn("stepio-card border-l-4 opacity-80", colorClass)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{event.title}</p>
                          {event.professional && (
                            <p className="text-sm opacity-80">{event.professional}</p>
                          )}
                          <p className="text-sm font-medium">
                            {format(parseISO(event.datetime), language === 'en' ? "MMM dd 'at' HH:mm" : "dd 'de' MMMM 'as' HH:mm", { locale: getDateLocale(language) })}
                          </p>
                        </div>
                        <button
                          onClick={() => onDelete(event.id)}
                          className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <button
        onClick={() => {
          if (limitReached) {
            navigate('/planos');
          } else {
            setShowForm(true);
          }
        }}
        className="stepio-fab"
      >
        <Plus size={28} />
      </button>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{byLanguage(language, 'Nova terapia', 'New therapy')}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isPro && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {byLanguage(language, 'Plano Free: ate 5 terapias por mes. Para liberar ilimitado, assine o Pro.', 'Free plan: up to 5 therapies per month. Upgrade to Pro for unlimited.')}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Tipo', 'Type')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["therapy", "doctor"] as const).map((type) => {
                    const Icon = eventIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={cn(
                          "p-3 rounded-xl border-2 flex items-center gap-2 transition-all",
                          formData.type === type ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{getEventTypeLabel(type, language)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Titulo', 'Title')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={byLanguage(language, 'Ex: Terapia Ocupacional', 'Ex: Occupational Therapy')}
                  className="stepio-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Profissional (opcional)', 'Professional (optional)')}</label>
                <input
                  type="text"
                  value={formData.professional}
                  onChange={(e) => setFormData({ ...formData, professional: e.target.value })}
                  placeholder={byLanguage(language, 'Ex: Dra. Maria', 'Ex: Dr. Maria')}
                  className="stepio-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Data', 'Date')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="stepio-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Horario', 'Time')}</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="stepio-input w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.title}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 disabled:opacity-50"
              >
                {byLanguage(language, 'Salvar terapia', 'Save therapy')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}