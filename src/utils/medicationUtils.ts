import { Medication } from '@/types/stepio';
import { addDays, addHours, isAfter, isBefore, format, startOfDay, setHours, setMinutes } from 'date-fns';

export interface NextMedication {
  medication: Medication;
  nextTime: Date;
  isOverdue: boolean;
}

export function getNextMedicationTime(medication: Medication, referenceDate: Date = new Date()): Date {
  const [hours, minutes] = medication.startTime.split(':').map(Number);
  const today = startOfDay(referenceDate);
  let nextTime = setMinutes(setHours(today, hours), minutes);

  // Use explicit times when provided
  if (medication.extraTimes && medication.extraTimes.length > 0) {
    const timeList = [medication.startTime, ...medication.extraTimes]
      .map((t) => t.split(':').map(Number))
      .map(([h, m]) => setMinutes(setHours(today, h), m))
      .sort((a, b) => a.getTime() - b.getTime());

    const next = timeList.find((time) => isAfter(time, referenceDate));
    return next ?? addDays(timeList[0], 1);
  }

  // Calculate interval based on frequency
  const intervalHours =
    medication.frequency === '6h'
      ? 6
      : medication.frequency === '8h'
        ? 8
        : medication.frequency === '12h'
          ? 12
          : 24;

  // Find the next occurrence
  while (isBefore(nextTime, referenceDate)) {
    nextTime = addHours(nextTime, intervalHours);
  }

  return nextTime;
}

export function getNextMedication(medications: Medication[]): NextMedication | null {
  if (medications.length === 0) return null;

  const now = new Date();
  let nearest: NextMedication | null = null;

  for (const med of medications) {
    if (med.frequency === 'sob_demanda') continue;

    const nextTime = getNextMedicationTime(med, now);
    
    if (!nearest || isBefore(nextTime, nearest.nextTime)) {
      nearest = {
        medication: med,
        nextTime,
        isOverdue: false, // Will be handled elsewhere if needed
      };
    }
  }

  return nearest;
}

export function formatMedicationTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function getMedicationSchedule(medication: Medication): string[] {
  const [hours, minutes] = medication.startTime.split(':').map(Number);
  const times: string[] = [];

  if (medication.extraTimes && medication.extraTimes.length > 0) {
    const allTimes = [medication.startTime, ...medication.extraTimes]
      .filter(Boolean)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    return Array.from(new Set(allTimes)).sort();
  }

  let currentHour = hours;
  const intervalHours =
    medication.frequency === '6h'
      ? 6
      : medication.frequency === '8h'
        ? 8
        : medication.frequency === '12h'
          ? 12
          : 24;

  const count =
    medication.frequency === '6h'
      ? 4
      : medication.frequency === '8h'
        ? 3
        : medication.frequency === '12h'
          ? 2
          : 1;

  for (let i = 0; i < count; i++) {
    const h = currentHour % 24;
    times.push(`${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    currentHour += intervalHours;
  }

  return times.sort();
}
