export interface User {
  name: string;
  email?: string;
  photo?: string;
}

export interface Child {
  id: string;
  name: string;
  birthDate: string; // ISO date string
  condition: ConditionType[];
  photo?: string;
  gender?: 'menina' | 'menino' | 'nao_informar';
}

export type ConditionType = string;

export interface Medication {
  id: string;
  childId: string;
  name: string;
  type: 'xarope' | 'comprimido' | 'gotas' | 'pomada';
  dosage: string;
  frequency: 'diario' | '6h' | '8h' | '12h' | 'sob_demanda';
  startTime: string; // HH:mm format
  extraTimes?: string[]; // HH:mm format
  notes?: string;
}

export interface Event {
  id: string;
  childId: string;
  title: string;
  professional?: string;
  datetime: string; // ISO datetime string
  type: 'therapy' | 'doctor' | 'school';
  notes?: string;
}

export interface Milestone {
  id: string;
  childId: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  photo?: string;
}

export interface DailyLog {
  childId: string;
  date: string; // YYYY-MM-DD
  mood?: string;
  food?: string;
  sleep?: string;
  crisis?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TherapyGoal {
  id: string;
  text: string;
  done: boolean;
  source: 'auto' | 'custom';
}

export interface TherapyPlan {
  childId: string;
  generatedAt: string;
  goals: TherapyGoal[];
}

export interface StepioData {
  user: User | null;
  child?: Child | null;
  children: Child[];
  activeChildId?: string | null;
  medications: Medication[];
  events: Event[];
  milestones: Milestone[];
  dailyLogs?: Record<string, DailyLog>;
  therapyPlans?: Record<string, TherapyPlan>;
  plan?: {
    tier: 'free' | 'pro';
    status?: 'active' | 'inactive' | 'past_due' | 'canceled';
    renewalDate?: string;
  };
  settings?: {
    notifyEvents: boolean;
    notifyMeds: boolean;
  };
  isOnboarded: boolean;
}

export const conditionLabels: Record<string, string> = {
  TEA: 'Autismo (TEA)',
  T21: 'Síndrome de Down (T21)',
  PC: 'Paralisia Cerebral',
  TDAH: 'TDAH',
  Epilepsia: 'Epilepsia',
  Rett: 'Síndrome de Rett',
  West: 'Síndrome de West',
  Microcefalia: 'Microcefalia',
  AGD: 'Atraso Global do Desenvolvimento',
  TGD: 'Transtorno Global do Desenvolvimento',
  Distonia: 'Distonia',
  Encefalopatia: 'Encefalopatia',
};

export const conditionOptions: { id: string; label: string }[] = [
  { id: 'TEA', label: conditionLabels.TEA },
  { id: 'T21', label: conditionLabels.T21 },
  { id: 'PC', label: conditionLabels.PC },
  { id: 'TDAH', label: conditionLabels.TDAH },
  { id: 'Epilepsia', label: conditionLabels.Epilepsia },
  { id: 'Rett', label: conditionLabels.Rett },
  { id: 'West', label: conditionLabels.West },
  { id: 'Microcefalia', label: conditionLabels.Microcefalia },
  { id: 'AGD', label: conditionLabels.AGD },
  { id: 'TGD', label: conditionLabels.TGD },
  { id: 'Distonia', label: conditionLabels.Distonia },
  { id: 'Encefalopatia', label: conditionLabels.Encefalopatia },
];

export const medicationTypeLabels: Record<Medication['type'], string> = {
  xarope: 'Xarope',
  comprimido: 'Comprimido',
  gotas: 'Gotas',
  pomada: 'Pomada',
};

export const frequencyLabels: Record<Medication['frequency'], string> = {
  diario: '1x ao dia',
  '6h': 'A cada 6 horas',
  '8h': 'A cada 8 horas',
  '12h': 'A cada 12 horas',
  sob_demanda: 'Sob demanda',
};

export const eventTypeLabels: Record<Event['type'], string> = {
  therapy: 'Terapia',
  doctor: 'Consulta',
  school: 'Escola',
};
