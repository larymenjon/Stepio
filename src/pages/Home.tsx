import type { DailyLog as DailyLogEntry } from "@/types/stepio";
import { User, Child, Medication, Event, StepioData, Milestone } from "@/types/stepio";
import { HeroCard } from "@/components/home/HeroCard";
import { MedicationStatus } from "@/components/home/MedicationStatus";
import { WeekAgenda } from "@/components/home/WeekAgenda";
import { MotivationalFooter } from "@/components/home/MotivationalFooter";
import stepioLogo from "@/assets/stepio-logo-3d.png";
import { DailyLog } from "@/components/home/DailyLog";
import { TherapyPlan } from "@/components/home/TherapyPlan";
import { useLanguage } from "@/context/LanguageContext";
import { byLanguage } from "@/i18n";

interface HomeProps {
  user: User;
  child: Child;
  medications: Medication[];
  events: Event[];
  dailyLogs: DailyLogEntry[];
  milestones: Milestone[];
  onAddMilestone: (milestone: Omit<Milestone, "id" | "childId">) => void;
  plan?: StepioData["plan"];
}

export function Home({ user, child, medications, events, dailyLogs, milestones, onAddMilestone, plan }: HomeProps) {
  const { language } = useLanguage();
  const genderClass =
    child.gender === "menina"
      ? "stepio-header-girl"
      : child.gender === "menino"
        ? "stepio-header-boy"
        : "stepio-header-neutral";
  return (
    <div className="pb-24">
      <header className={`stepio-header stepio-header-lg stepio-header-home ${genderClass}`}>
        <div className="stepio-header-content flex flex-col items-center justify-center gap-3 text-center">
          <img
            src={stepioLogo}
            alt="Stepio"
            className="w-[214px] h-[214px] object-contain"
          />
          <div className="flex items-center gap-2">
            <span
              className={`stepio-header-badge ${
                plan?.tier === "pro" && plan?.status === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-emerald-500 text-white"
              }`}
            >
              {plan?.tier === "pro" && plan?.status === "active" ? "PRO" : "FREE"}
            </span>
            <span
              className={`text-xs ${
                plan?.tier === "pro" && plan?.status === "active"
                  ? "text-white/80"
                  : "text-emerald-600"
              }`}
            >
              {plan?.tier === "pro" && plan?.status === "active"
                ? byLanguage(language, "Plano ativo", "Active plan")
                : byLanguage(language, "Plano gratuito", "Free plan")}
            </span>
          </div>
        </div>
        <div className="stepio-header-card mt-4 text-center">
          <span className="text-sm font-semibold text-slate-900/80">
            {byLanguage(language, "Cuidado, rotina e progresso do seu filho", "Care, routine, and your child's progress")}
          </span>
        </div>
      </header>

      <main className="px-4 space-y-4">
        <HeroCard user={user} child={child} />
        <MedicationStatus medications={medications} />
        <WeekAgenda events={events} />
        <TherapyPlan
          child={child}
          events={events}
          logs={dailyLogs}
          milestones={milestones}
          onAddMilestone={onAddMilestone}
          plan={plan}
        />
        <DailyLog />
        <MotivationalFooter />
      </main>
    </div>
  );
}