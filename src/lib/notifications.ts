import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { addDays, addMinutes, isAfter, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { Event, Medication } from "@/types/stepio";
import { getMedicationSchedule } from "@/utils/medicationUtils";

const CHANNEL_ID = "stepio-reminders";

function isNative() {
  return Capacitor.isNativePlatform();
}

export function isNotificationPlatformSupported() {
  return isNative();
}

function hashId(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function ensureChannel() {
  if (!isNative()) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Stepio reminders",
      description: "Appointment and medication reminders",
      importance: 4,
      visibility: 1,
    });
  } catch {
    // Channel may already exist
  }
}

async function ensurePermissions() {
  if (!isNative()) return false;
  const status = await LocalNotifications.checkPermissions();
  if (status.display !== "granted") return false;
  await ensureChannel();
  return true;
}

export async function requestNotificationPermissionOnDevice() {
  if (!isNative()) return false;
  const requested = await LocalNotifications.requestPermissions();
  if (requested.display !== "granted") return false;
  await ensureChannel();
  return true;
}

async function clearAll() {
  if (!isNative()) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length === 0) return;
  await LocalNotifications.cancel({
    notifications: pending.notifications.map((n) => ({ id: n.id })),
  });
}

function buildId(key: string) {
  return hashId(key);
}

export async function scheduleEventNotifications(event: Event) {
  if (!isNative()) return;
  const hasPermission = await ensurePermissions();
  if (!hasPermission) return;

  const base = parseISO(event.datetime);
  const offsets = [
    { label: "1 day", minutes: -24 * 60 },
    { label: "30 min", minutes: -30 },
    { label: "now", minutes: 0 },
  ];

  const notifications = offsets
    .map((offset) => {
      const at = addMinutes(base, offset.minutes);
      return { offset, at };
    })
    .filter(({ at }) => isAfter(at, new Date()))
    .map(({ offset, at }) => ({
      id: buildId(`event:${event.id}:${offset.minutes}`),
      title: "Upcoming appointment",
      body: offset.minutes === 0 ? `${event.title} now` : `${event.title} in ${offset.label}`,
      schedule: { at },
      channelId: CHANNEL_ID,
    }));

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (error) {
      console.error("Failed to schedule event notifications", error);
    }
  }
}

export async function cancelEventNotifications(event: Event) {
  if (!isNative()) return;
  const ids = [-24 * 60, -30, 0].map((offset) => ({ id: buildId(`event:${event.id}:${offset}`) }));
  await LocalNotifications.cancel({ notifications: ids });
}

export async function scheduleMedicationNotifications(medication: Medication) {
  if (!isNative()) return;
  const hasPermission = await ensurePermissions();
  if (!hasPermission) return;

  const now = new Date();
  const tomorrow = addDays(startOfDay(now), 1);
  const times = getMedicationSchedule(medication);

  const notifications = [];

  for (const time of times) {
    const [h, m] = time.split(":").map(Number);
    const reminders = [
      { label: "1h", minutes: -60 },
      { label: "5 min", minutes: -5 },
      { label: "now", minutes: 0 },
    ];

    for (const offset of reminders) {
      const totalMinutes = h * 60 + m + offset.minutes;
      const targetHour = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
      const targetMinute = ((totalMinutes % 60) + 60) % 60;

      let firstAt = setMinutes(setHours(startOfDay(now), targetHour), targetMinute);
      if (!isAfter(firstAt, now)) {
        firstAt = setMinutes(setHours(tomorrow, targetHour), targetMinute);
      }

      const id = buildId(`med:${medication.id}:${time}:${offset.minutes}`);
      notifications.push({
        id,
        title: "Medication reminder",
        body: offset.minutes === 0 ? `${medication.name} now` : `${medication.name} in ${offset.label}`,
        schedule: { at: firstAt, repeats: true },
        channelId: CHANNEL_ID,
      });
    }
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (error) {
      console.error("Failed to schedule medication notifications", error);
    }
  }
}

export async function cancelMedicationNotifications(medication: Medication) {
  if (!isNative()) return;
  const times = getMedicationSchedule(medication);
  const ids = [];
  for (const time of times) {
    const id1 = buildId(`med:${medication.id}:${time}:-60`);
    const id2 = buildId(`med:${medication.id}:${time}:-5`);
    const id3 = buildId(`med:${medication.id}:${time}:0`);
    ids.push({ id: id1 }, { id: id2 }, { id: id3 });
  }
  await LocalNotifications.cancel({ notifications: ids });
}

export async function rescheduleAll(
  events: Event[],
  medications: Medication[],
  notifyEvents: boolean,
  notifyMeds: boolean,
) {
  if (!isNative()) return;
  await clearAll();
  if (notifyEvents) {
    for (const event of events) {
      await scheduleEventNotifications(event);
    }
  }
  if (notifyMeds) {
    for (const med of medications) {
      await scheduleMedicationNotifications(med);
    }
  }
}