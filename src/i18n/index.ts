import { enUS, ptBR } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { ConditionType, Event, Medication } from "@/types/stepio";

export type AppLanguage = "pt-BR" | "en";

export function byLanguage(language: AppLanguage, pt: string, en: string): string {
  return language === "en" ? en : pt;
}

export function getDateLocale(language: AppLanguage): Locale {
  return language === "en" ? enUS : ptBR;
}

export function getMedicationTypeLabel(type: Medication["type"], language: AppLanguage): string {
  const labels: Record<Medication["type"], { pt: string; en: string }> = {
    xarope: { pt: "Xarope", en: "Syrup" },
    comprimido: { pt: "Comprimido", en: "Tablet" },
    gotas: { pt: "Gotas", en: "Drops" },
    pomada: { pt: "Pomada", en: "Ointment" },
  };
  return byLanguage(language, labels[type].pt, labels[type].en);
}

export function getFrequencyLabel(
  frequency: Medication["frequency"],
  language: AppLanguage,
): string {
  const labels: Record<Medication["frequency"], { pt: string; en: string }> = {
    diario: { pt: "1x ao dia", en: "Once a day" },
    "6h": { pt: "A cada 6 horas", en: "Every 6 hours" },
    "8h": { pt: "A cada 8 horas", en: "Every 8 hours" },
    "12h": { pt: "A cada 12 horas", en: "Every 12 hours" },
    sob_demanda: { pt: "Sob demanda", en: "As needed" },
  };
  return byLanguage(language, labels[frequency].pt, labels[frequency].en);
}

export function getEventTypeLabel(type: Event["type"], language: AppLanguage): string {
  const labels: Record<Event["type"], { pt: string; en: string }> = {
    therapy: { pt: "Terapia", en: "Therapy" },
    doctor: { pt: "Consulta", en: "Doctor" },
    school: { pt: "Escola", en: "School" },
  };
  return byLanguage(language, labels[type].pt, labels[type].en);
}

export function getConditionLabel(condition: ConditionType, language: AppLanguage): string {
  const labels: Record<string, { pt: string; en: string }> = {
    TEA: { pt: "Autismo (TEA)", en: "Autism (ASD)" },
    T21: { pt: "Sindrome de Down (T21)", en: "Down Syndrome (T21)" },
    PC: { pt: "Paralisia Cerebral", en: "Cerebral Palsy" },
    TDAH: { pt: "TDAH", en: "ADHD" },
    Epilepsia: { pt: "Epilepsia", en: "Epilepsy" },
    Rett: { pt: "Sindrome de Rett", en: "Rett Syndrome" },
    West: { pt: "Sindrome de West", en: "West Syndrome" },
    Microcefalia: { pt: "Microcefalia", en: "Microcephaly" },
    AGD: { pt: "Atraso Global do Desenvolvimento", en: "Global Developmental Delay" },
    TGD: { pt: "Transtorno Global do Desenvolvimento", en: "Pervasive Developmental Disorder" },
    Distonia: { pt: "Distonia", en: "Dystonia" },
    Encefalopatia: { pt: "Encefalopatia", en: "Encephalopathy" },
  };
  const label = labels[condition];
  if (!label) return condition;
  return byLanguage(language, label.pt, label.en);
}

export function getDailyQuotes(language: AppLanguage): string[] {
  if (language === "en") {
    return [
      "Every small step is a big win.",
      "You are exactly the parent your child needs.",
      "A parent's love can move mountains.",
      "Celebrate each achievement, no matter how small.",
      "You are not alone on this journey.",
      "Your child is lucky to have you.",
      "One day at a time, one win at a time.",
      "You are stronger than you think.",
      "Progress is not always linear, and that is okay.",
      "Your dedication makes all the difference.",
      "Take a deep breath. You are doing great.",
      "Every child has their own pace to bloom.",
      "Your patience is a superpower.",
      "Today is a new day full of possibilities.",
      "You are a warrior. Never forget that.",
    ];
  }
  return [
    "Cada pequeno passo e uma grande vitoria.",
    "Voce e a melhor mae que seu filho poderia ter.",
    "O amor de mae move montanhas.",
    "Celebre cada conquista, por menor que pareca.",
    "Voce nao esta sozinha nessa jornada.",
    "Seu filho tem sorte de ter voce.",
    "Um dia de cada vez, uma conquista de cada vez.",
    "Voce e mais forte do que imagina.",
    "O progresso nem sempre e linear, e tudo bem.",
    "Sua dedicacao faz toda a diferenca.",
    "Respire fundo. Voce esta indo muito bem.",
    "Cada crianca tem seu proprio tempo de florescer.",
    "Sua paciencia e um superpoder.",
    "Hoje e um novo dia cheio de possibilidades.",
    "Voce e uma guerreira. Nunca esqueca disso.",
  ];
}
