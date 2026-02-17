import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, isWithinInterval, parseISO, subDays } from "date-fns";
import { Brain, Calendar, Check, Sparkles, Target } from "lucide-react";
import { Child, DailyLog, Event, Milestone, StepioData, TherapyGoal } from "@/types/stepio";
import { cn } from "@/lib/utils";
import { useStepioData } from "@/hooks/useStepioData";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage, getDateLocale } from "@/i18n";

interface TherapyPlanProps {
  child: Child;
  events: Event[];
  logs: DailyLog[];
  milestones: Milestone[];
  onAddMilestone: (milestone: Omit<Milestone, "id" | "childId">) => void;
  plan?: StepioData["plan"];
}

const negativeMoods = new Set(["irritado", "raiva", "agressivo"]);
const sleepChallenges = new Set(["acordou", "pouco", "insonia"]);
const foodChallenges = new Set(["seletivo", "pouco", "recusou", "enjoo"]);

export function TherapyPlan({ child, events, logs, milestones, onAddMilestone, plan }: TherapyPlanProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data, generateTherapyPlan, addTherapyGoal, toggleTherapyGoal } = useStepioData();
  const isPro = plan?.tier === "pro" && plan?.status === "active";
  const [customGoal, setCustomGoal] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const activePlan = data.therapyPlans?.[child.id];

  const { goals, weekPlan, monthSummary } = useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    const weekStart = subDays(now, 6);

    const upcoming = events
      .filter((event) =>
        isWithinInterval(parseISO(event.datetime), { start: now, end: weekEnd }),
      )
      .sort((a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime());

    const recentLogs = logs.filter((log) => {
      if (!log.date) return false;
      const date = parseISO(log.date);
      return isWithinInterval(date, { start: weekStart, end: now });
    });

    const moodAlerts = recentLogs.filter((log) => log.mood && negativeMoods.has(log.mood)).length;
    const sleepAlerts = recentLogs.filter((log) => log.sleep && sleepChallenges.has(log.sleep)).length;
    const foodAlerts = recentLogs.filter((log) => log.food && foodChallenges.has(log.food)).length;

    const goalsList: string[] = [];
    if (upcoming.length === 0) {
      goalsList.push(byLanguage(language, "Agendar ao menos 1 terapia nesta semana.", "Schedule at least 1 therapy this week."));
    } else if (upcoming.length < 2) {
      goalsList.push(byLanguage(language, "Adicionar mais uma sessao se possivel.", "Add one more session if possible."));
    } else {
      goalsList.push(byLanguage(language, "Manter as sessoes planejadas da semana.", "Keep the planned sessions this week."));
    }

    if (moodAlerts >= 2) {
      goalsList.push(byLanguage(language, "Registrar gatilhos e emocoes apos as sessoes.", "Log triggers and emotions after sessions."));
    }
    if (sleepAlerts >= 2) {
      goalsList.push(byLanguage(language, "Ajustar rotina de sono com horario fixo.", "Adjust sleep routine with a fixed bedtime."));
    }
    if (foodAlerts >= 2) {
      goalsList.push(byLanguage(language, "Planejar alimentacao com foco em variedade.", "Plan meals with focus on variety."));
    }

    if (goalsList.length === 0) {
      goalsList.push(byLanguage(language, "Registrar o diario em 3 dias da semana.", "Fill the daily log on 3 days this week."));
    }

    const monthStart = subDays(now, 29);
    const monthLogs = logs.filter((log) => {
      if (!log.date) return false;
      const date = parseISO(log.date);
      return isWithinInterval(date, { start: monthStart, end: now });
    });

    const moodCounts = monthLogs.reduce<Record<string, number>>((acc, log) => {
      if (log.mood) acc[log.mood] = (acc[log.mood] ?? 0) + 1;
      return acc;
    }, {});

    const sleepCounts = monthLogs.reduce<Record<string, number>>((acc, log) => {
      if (log.sleep) acc[log.sleep] = (acc[log.sleep] ?? 0) + 1;
      return acc;
    }, {});

    const foodCounts = monthLogs.reduce<Record<string, number>>((acc, log) => {
      if (log.food) acc[log.food] = (acc[log.food] ?? 0) + 1;
      return acc;
    }, {});

    const crisisCounts = monthLogs.reduce<Record<string, number>>((acc, log) => {
      if (log.crisis) acc[log.crisis] = (acc[log.crisis] ?? 0) + 1;
      return acc;
    }, {});

    const weekPlanItems = [
      ...upcoming.map((event) => ({
        title: `${event.title}`,
        subtitle: format(parseISO(event.datetime), language === "en" ? "EEE, MMM dd • HH:mm" : "EEE, dd 'de' MMM • HH:mm", {
          locale: getDateLocale(language),
        }),
      })),
      {
        title: byLanguage(language, "Registro de humor", "Mood log"),
        subtitle: byLanguage(language, "Preencher 3 dias nesta semana", "Fill 3 days this week"),
      },
      {
        title: byLanguage(language, "Revisao de metas", "Goal review"),
        subtitle: byLanguage(language, "Domingo a noite", "Sunday night"),
      },
    ];

    return {
      goals: goalsList,
      weekPlan: weekPlanItems.slice(0, 5),
      monthSummary: {
        totalLogs: monthLogs.length,
        moodCounts,
        sleepCounts,
        foodCounts,
        crisisCounts,
        upcomingCount: upcoming.length,
      },
    };
  }, [events, logs, language]);

  const autoGoals: Omit<TherapyGoal, "id" | "done">[] = goals.map((goal) => ({
    text: goal,
    source: "auto",
  }));

  const planGoals = activePlan?.goals ?? [];

  const getTopLabel = (counts: Record<string, number>) => {
    const entries = Object.entries(counts);
    if (entries.length === 0) return byLanguage(language, "Sem dados", "No data");
    const [label, count] = entries.sort((a, b) => b[1] - a[1])[0];
    return `${label} (${count})`;
  };

  return (
    <div className="stepio-card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{byLanguage(language, "Plano inteligente", "Smart plan")}</p>
          <h3 className="text-lg font-bold">{byLanguage(language, `Plano terapeutico de ${child.name}`, `${child.name}'s therapy plan`)}</h3>
          <p className="text-sm text-muted-foreground">
            {byLanguage(language, "Gerado com base na agenda e registros recentes.", "Generated from schedule and recent logs.")}
          </p>
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

      <div className={cn("space-y-3", !isPro && "opacity-60")}>
        <div className="rounded-2xl border border-border p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={16} />
              {byLanguage(language, "Plano gerado", "Generated plan")}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  navigate("/planos");
                  return;
                }
                generateTherapyPlan(child.id, autoGoals);
              }}
              className="text-xs font-semibold text-primary"
            >
              {byLanguage(language, "Gerar plano", "Generate plan")}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {activePlan?.generatedAt
              ? byLanguage(
                  language,
                  `Atualizado em ${format(parseISO(activePlan.generatedAt), "dd/MM/yyyy")}`,
                  `Updated on ${format(parseISO(activePlan.generatedAt), "MM/dd/yyyy")}`,
                )
              : byLanguage(language, "Nenhum plano salvo ainda.", "No saved plan yet.")}
          </p>
        </div>

        <div className="rounded-2xl border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Target size={16} />
            {byLanguage(language, "Metas da semana", "Weekly goals")}
          </div>
          {planGoals.length > 0 ? (
            <div className="space-y-2 text-sm">
              {planGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    if (!isPro) {
                      navigate("/planos");
                      return;
                    }
                    toggleTherapyGoal(child.id, goal.id);
                  }}
                  className={cn(
                    "w-full flex items-start gap-2 rounded-xl border border-border px-3 py-2 text-left",
                    goal.done ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Check
                    size={16}
                    className={cn(
                      "mt-0.5",
                      goal.done ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className={cn("text-sm font-medium", goal.done && "line-through")}>{goal.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.source === "auto" ? byLanguage(language, "Sugerida", "Suggested") : byLanguage(language, "Personalizada", "Custom")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {byLanguage(language, "Gere um plano para ver metas sugeridas.", "Generate a plan to see suggested goals.")}
            </p>
          )}
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={customGoal}
              onChange={(event) => setCustomGoal(event.target.value)}
              placeholder={byLanguage(language, "Adicionar meta personalizada", "Add custom goal")}
              className="stepio-input w-full"
            />
            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  navigate("/planos");
                  return;
                }
                if (!customGoal.trim()) return;
                addTherapyGoal(child.id, customGoal.trim());
                setCustomGoal("");
              }}
              className="w-full py-2 rounded-xl border border-primary text-primary text-sm font-semibold"
            >
              {byLanguage(language, "Adicionar meta", "Add goal")}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Calendar size={16} />
            {byLanguage(language, "Trilha semanal", "Weekly track")}
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {weekPlan.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Brain size={14} className="mt-0.5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Brain size={16} />
            {byLanguage(language, "Resumo do mes", "Month summary")}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="rounded-xl border border-border px-3 py-2">
              <p className="font-semibold text-foreground">{byLanguage(language, "Registros", "Logs")}</p>
              <p>{byLanguage(language, `${monthSummary.totalLogs} dias registrados`, `${monthSummary.totalLogs} logged days`)}</p>
            </div>
            <div className="rounded-xl border border-border px-3 py-2">
              <p className="font-semibold text-foreground">{byLanguage(language, "Terapias", "Therapies")}</p>
              <p>{byLanguage(language, `${monthSummary.upcomingCount} marcadas na semana`, `${monthSummary.upcomingCount} this week`)}</p>
            </div>
            <div className="rounded-xl border border-border px-3 py-2">
              <p className="font-semibold text-foreground">{byLanguage(language, "Humor", "Mood")}</p>
              <p>{getTopLabel(monthSummary.moodCounts)}</p>
            </div>
            <div className="rounded-xl border border-border px-3 py-2">
              <p className="font-semibold text-foreground">{byLanguage(language, "Sono", "Sleep")}</p>
              <p>{getTopLabel(monthSummary.sleepCounts)}</p>
            </div>
            <div className="rounded-xl border border-border px-3 py-2">
              <p className="font-semibold text-foreground">{byLanguage(language, "Alimentacao", "Food")}</p>
              <p>{getTopLabel(monthSummary.foodCounts)}</p>
            </div>
            <div className="rounded-xl border border-border px-3 py-2">
              <p className="font-semibold text-foreground">{byLanguage(language, "Crises", "Crises")}</p>
              <p>{getTopLabel(monthSummary.crisisCounts)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold">{byLanguage(language, "Marcos", "Milestones")}</p>
            <button
              type="button"
              onClick={() => setShowMilestoneForm((prev) => !prev)}
              className="text-xs font-semibold text-primary"
            >
              {showMilestoneForm ? byLanguage(language, "Fechar", "Close") : byLanguage(language, "Adicionar", "Add")}
            </button>
          </div>
          {showMilestoneForm && (
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={milestoneTitle}
                onChange={(event) => setMilestoneTitle(event.target.value)}
                placeholder={byLanguage(language, "Ex: Novo comportamento positivo", "Ex: New positive behavior")}
                className="stepio-input w-full"
              />
              <input
                type="date"
                value={milestoneDate}
                onChange={(event) => setMilestoneDate(event.target.value)}
                className="stepio-input w-full"
              />
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    navigate("/planos");
                    return;
                  }
                  if (!milestoneTitle.trim()) return;
                  onAddMilestone({
                    title: milestoneTitle.trim(),
                    date: milestoneDate,
                  });
                  setMilestoneTitle("");
                  setMilestoneDate(format(new Date(), "yyyy-MM-dd"));
                  setShowMilestoneForm(false);
                }}
                className="w-full py-2 rounded-xl border border-primary text-primary text-sm font-semibold"
              >
                {byLanguage(language, "Salvar marco", "Save milestone")}
              </button>
            </div>
          )}
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">{byLanguage(language, "Nenhum marco registrado.", "No milestone recorded.")}</p>
          ) : (
            <div className="space-y-2 text-sm">
              {milestones.slice(0, 3).map((milestone) => (
                <div key={milestone.id} className="rounded-xl border border-border px-3 py-2">
                  <p className="font-semibold text-foreground">{milestone.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(milestone.date), language === "en" ? "MM/dd/yyyy" : "dd/MM/yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isPro && (
        <button
          type="button"
          onClick={() => navigate("/planos")}
          className="w-full py-3 rounded-2xl border border-primary text-primary font-semibold"
        >
          {byLanguage(language, "Desbloquear plano inteligente", "Unlock smart plan")}
        </button>
      )}
    </div>
  );
}