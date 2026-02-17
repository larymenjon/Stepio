import { useEffect, useMemo, useState } from "react";
import { format, isWithinInterval, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useStepioData } from "@/hooks/useStepioData";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

const moodOptions = [
  { id: "irritado", pt: "Irritado", en: "Irritated", emoji: "😣" },
  { id: "raiva", pt: "Com raiva", en: "Angry", emoji: "😡" },
  { id: "agressivo", pt: "Agressivo", en: "Aggressive", emoji: "😤" },
  { id: "calmo", pt: "Calmo", en: "Calm", emoji: "😌" },
  { id: "vagaroso", pt: "Vagaroso", en: "Sluggish", emoji: "🐢" },
];

const foodOptions = [
  { id: "bem", pt: "Comendo bem", en: "Eating well", emoji: "😋" },
  { id: "seletivo", pt: "Seletivo", en: "Picky", emoji: "🥦" },
  { id: "pouco", pt: "Comeu pouco", en: "Ate little", emoji: "🍽️" },
  { id: "recusou", pt: "Recusou", en: "Refused", emoji: "🚫" },
  { id: "enjoo", pt: "Enjoado", en: "Nauseous", emoji: "🤢" },
];

const sleepOptions = [
  { id: "bem", pt: "Dormiu bem", en: "Slept well", emoji: "😴" },
  { id: "acordou", pt: "Acordou várias vezes", en: "Woke up many times", emoji: "🌙" },
  { id: "pouco", pt: "Dormiu pouco", en: "Slept little", emoji: "🥱" },
  { id: "cochilo", pt: "Cochilou bem", en: "Good nap", emoji: "🛌" },
  { id: "insonia", pt: "Insônia", en: "Insomnia", emoji: "😵" },
];

const crisisOptions = [
  { id: "sem", pt: "Sem crise", en: "No crisis", emoji: "✅" },
  { id: "leve", pt: "Leve", en: "Mild", emoji: "⚠️" },
  { id: "moderada", pt: "Moderada", en: "Moderate", emoji: "😣" },
  { id: "forte", pt: "Forte", en: "Severe", emoji: "🚨" },
];

function labelByLanguage(option: { pt: string; en: string }, language: 'pt-BR' | 'en') {
  return byLanguage(language, option.pt, option.en);
}

function OptionGroup({
  title,
  options,
  value,
  onChange,
  language,
}: {
  title: string;
  options: { id: string; pt: string; en: string; emoji: string }[];
  value?: string;
  onChange: (id: string) => void;
  language: 'pt-BR' | 'en';
}) {
  return (
    <div>
      <p className="text-sm font-semibold mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "p-3 rounded-2xl border-2 flex items-center gap-2 text-left transition-all",
              value === option.id ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <span className="text-xl">{option.emoji}</span>
            <span className="text-sm font-medium">{labelByLanguage(option, language)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DailyLog() {
  const { data, setDailyLog } = useStepioData();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const today = format(new Date(), "yyyy-MM-dd");
  const activeChildId = data.activeChildId ?? data.child?.id ?? null;
  const logKey = activeChildId ? `${activeChildId}:${today}` : today;
  const existing = data.dailyLogs?.[logKey];
  const isPro = data.plan?.tier === "pro" && data.plan?.status === "active";

  const [mood, setMood] = useState(existing?.mood ?? "");
  const [food, setFood] = useState(existing?.food ?? "");
  const [sleep, setSleep] = useState(existing?.sleep ?? "");
  const [crisis, setCrisis] = useState(existing?.crisis ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saved, setSaved] = useState(false);
  const [showMonth, setShowMonth] = useState(false);
  const [editing, setEditing] = useState(!existing);

  const moodMap = useMemo(() => Object.fromEntries(moodOptions.map((o) => [o.id, o])), []);
  const foodMap = useMemo(() => Object.fromEntries(foodOptions.map((o) => [o.id, o])), []);
  const sleepMap = useMemo(() => Object.fromEntries(sleepOptions.map((o) => [o.id, o])), []);
  const crisisMap = useMemo(() => Object.fromEntries(crisisOptions.map((o) => [o.id, o])), []);

  useEffect(() => {
    if (existing) {
      setMood(existing.mood ?? "");
      setFood(existing.food ?? "");
      setSleep(existing.sleep ?? "");
      setCrisis(existing.crisis ?? "");
      setNotes(existing.notes ?? "");
      setEditing(false);
      return;
    }

    setMood("");
    setFood("");
    setSleep("");
    setCrisis("");
    setNotes("");
    setEditing(true);
  }, [existing?.mood, existing?.food, existing?.sleep, existing?.crisis, existing?.notes]);

  const canSave = useMemo(() => mood || food || sleep || crisis || notes, [mood, food, sleep, crisis, notes]);

  const monthLogs = useMemo(() => {
    const logs = Object.values(data.dailyLogs ?? {});
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return logs.filter(
      (log) =>
        log.date &&
        log.childId === activeChildId &&
        isWithinInterval(parseISO(log.date), { start, end }),
    );
  }, [activeChildId, data.dailyLogs]);

  const handleSave = () => {
    setDailyLog(today, {
      mood,
      food,
      sleep,
      crisis,
      notes,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="stepio-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{byLanguage(language, 'Registro Diario', 'Daily Log')}</h3>
          <p className="text-sm text-muted-foreground">{format(new Date(), language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')}</p>
        </div>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold",
            isPro ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {isPro ? "PRO" : "FREE"}
        </span>
      </div>

      {editing && (
        <>
          <OptionGroup title={byLanguage(language, 'Humor', 'Mood')} options={moodOptions} value={mood} onChange={setMood} language={language} />
          <OptionGroup title={byLanguage(language, 'Alimentacao', 'Food')} options={foodOptions} value={food} onChange={setFood} language={language} />
          <OptionGroup title={byLanguage(language, 'Sono', 'Sleep')} options={sleepOptions} value={sleep} onChange={setSleep} language={language} />
          <OptionGroup title={byLanguage(language, 'Crises', 'Crises')} options={crisisOptions} value={crisis} onChange={setCrisis} language={language} />
        </>
      )}

      {canSave && (
        <div className="flex flex-wrap gap-2">
          {mood && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
              <span>{moodMap[mood]?.emoji}</span>
              {moodMap[mood] ? labelByLanguage(moodMap[mood], language) : mood}
            </span>
          )}
          {food && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
              <span>{foodMap[food]?.emoji}</span>
              {foodMap[food] ? labelByLanguage(foodMap[food], language) : food}
            </span>
          )}
          {sleep && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
              <span>{sleepMap[sleep]?.emoji}</span>
              {sleepMap[sleep] ? labelByLanguage(sleepMap[sleep], language) : sleep}
            </span>
          )}
          {crisis && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
              <span>{crisisMap[crisis]?.emoji}</span>
              {crisisMap[crisis] ? labelByLanguage(crisisMap[crisis], language) : crisis}
            </span>
          )}
        </div>
      )}

      {editing && (
        <div>
          <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Notas', 'Notes')}</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={byLanguage(language, 'Escreva algo importante sobre o dia...', 'Write something important about the day...')}
            className="stepio-input w-full resize-none"
          />
        </div>
      )}

      {editing ? (
        <button
          type="button"
          onClick={() => {
            handleSave();
            setEditing(false);
          }}
          disabled={!canSave}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 disabled:opacity-50"
        >
          {saved ? byLanguage(language, 'Salvo!', 'Saved!') : byLanguage(language, 'Salvar registro', 'Save log')}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full py-3 rounded-2xl border border-border font-bold"
        >
          {byLanguage(language, 'Editar registro', 'Edit log')}
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          if (isPro) {
            setShowMonth(true);
          } else {
            navigate('/planos');
          }
        }}
        className={cn(
          'w-full py-3 rounded-2xl border font-semibold',
          isPro ? 'border-primary text-primary' : 'border-border text-muted-foreground',
        )}
      >
        {byLanguage(language, 'Ver registros do mes', 'View month logs')}
      </button>

      {!isPro && (
        <p className="text-xs text-muted-foreground text-center">
          {byLanguage(language, 'Recurso Pro: veja e exporte o mes completo.', 'Pro feature: view and export full month.')}
        </p>
      )}

      <DailyLogMonthModal
        open={showMonth}
        onClose={() => setShowMonth(false)}
        logs={monthLogs}
      />
    </div>
  );
}

export function DailyLogMonthModal({
  open,
  onClose,
  logs,
}: {
  open: boolean;
  onClose: () => void;
  logs: {
    childId: string;
    date: string;
    mood?: string;
    food?: string;
    sleep?: string;
    crisis?: string;
    notes?: string;
  }[];
}) {
  const { language } = useLanguage();
  const moodMap = useMemo(() => Object.fromEntries(moodOptions.map((o) => [o.id, o])), []);
  const foodMap = useMemo(() => Object.fromEntries(foodOptions.map((o) => [o.id, o])), []);
  const sleepMap = useMemo(() => Object.fromEntries(sleepOptions.map((o) => [o.id, o])), []);
  const crisisMap = useMemo(() => Object.fromEntries(crisisOptions.map((o) => [o.id, o])), []);

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{byLanguage(language, 'Registros do mes', 'Month logs')}</h2>
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border border-border">
            {byLanguage(language, 'Fechar', 'Close')}
          </button>
        </div>
        <div className="space-y-3">
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground">{byLanguage(language, 'Nenhum registro neste mes.', 'No logs this month.')}</p>
          )}
          {logs.map((log) => (
            <div key={`${log.childId}-${log.date}`} className="rounded-2xl border border-border p-3 space-y-2">
              <p className="text-sm font-semibold">{log.date}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {log.mood && moodMap[log.mood] && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {moodMap[log.mood].emoji} {labelByLanguage(moodMap[log.mood], language)}
                  </span>
                )}
                {log.food && foodMap[log.food] && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {foodMap[log.food].emoji} {labelByLanguage(foodMap[log.food], language)}
                  </span>
                )}
                {log.sleep && sleepMap[log.sleep] && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {sleepMap[log.sleep].emoji} {labelByLanguage(sleepMap[log.sleep], language)}
                  </span>
                )}
                {log.crisis && crisisMap[log.crisis] && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {crisisMap[log.crisis].emoji} {labelByLanguage(crisisMap[log.crisis], language)}
                  </span>
                )}
              </div>
              {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
