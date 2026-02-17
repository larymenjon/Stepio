import { useState, useEffect, useCallback } from 'react';
import { StepioData, User, Child, Medication, Event, Milestone, TherapyGoal } from '@/types/stepio';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  scheduleEventNotifications,
  cancelEventNotifications,
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  isNotificationPlatformSupported,
  requestNotificationPermissionOnDevice,
  rescheduleAll,
} from '@/lib/notifications';

const adminOverrideEnabled = import.meta.env.VITE_ADMIN_OVERRIDE === 'true';
const adminOverrideEmail = (import.meta.env.VITE_ADMIN_EMAIL ?? '').toLowerCase();
const NOTIFICATIONS_PROMPT_KEY = 'stepio.notifications.prompted.v1';

const defaultData: StepioData = {
  user: null,
  child: null,
  children: [],
  activeChildId: null,
  medications: [],
  events: [],
  milestones: [],
  dailyLogs: {},
  therapyPlans: {},
  plan: {
    tier: 'free',
    status: 'inactive',
  },
  settings: {
    notifyEvents: true,
    notifyMeds: true,
  },
  isOnboarded: false,
};

const createChildId = () => crypto.randomUUID();

const resolveActiveChildId = (state: StepioData) =>
  state.activeChildId ?? state.children?.[0]?.id ?? state.child?.id ?? null;

const normalizeData = (input: StepioData) => {
  let changed = false;
  let next: StepioData = {
    ...defaultData,
    ...input,
    settings: {
      ...defaultData.settings,
      ...(input.settings ?? {}),
    },
    plan: {
      ...defaultData.plan,
      ...(input.plan ?? {}),
    },
    dailyLogs: {
      ...(defaultData.dailyLogs ?? {}),
      ...(input.dailyLogs ?? {}),
    },
    therapyPlans: {
      ...(defaultData.therapyPlans ?? {}),
      ...(input.therapyPlans ?? {}),
    },
  };

  const rawChildren = next.children ?? [];
  if (rawChildren.length === 0 && next.child) {
    const childWithId = next.child.id
      ? next.child
      : { ...next.child, id: createChildId() };
    next.children = [childWithId];
    next.activeChildId = childWithId.id;
    next.child = childWithId;
    changed = true;
  } else {
    const updatedChildren = rawChildren.map((child) =>
      child.id ? child : { ...child, id: createChildId() },
    );
    const childIdChanged = updatedChildren.some((child, index) => child.id !== rawChildren[index]?.id);
    if (childIdChanged) {
      changed = true;
    }
    next.children = updatedChildren;
    if (!next.activeChildId && updatedChildren.length > 0) {
      next.activeChildId = updatedChildren[0].id;
      changed = true;
    }
    if (
      next.activeChildId &&
      !updatedChildren.some((child) => child.id === next.activeChildId)
    ) {
      next.activeChildId = updatedChildren[0]?.id ?? null;
      changed = true;
    }
  }

  const activeChild =
    next.children.find((child) => child.id === next.activeChildId) ??
    next.children[0] ??
    null;
  if (activeChild && (!next.child || next.child.id !== activeChild.id)) {
    next.child = activeChild;
    changed = true;
  }

  const activeChildId = resolveActiveChildId(next);
  if (activeChildId) {
    const normalizedEvents = next.events.map((event) =>
      event.childId ? event : { ...event, childId: activeChildId },
    );
    if (normalizedEvents.some((event, index) => event.childId !== next.events[index]?.childId)) {
      changed = true;
    }
    next.events = normalizedEvents;

    const normalizedMeds = next.medications.map((med) =>
      med.childId ? med : { ...med, childId: activeChildId },
    );
    if (normalizedMeds.some((med, index) => med.childId !== next.medications[index]?.childId)) {
      changed = true;
    }
    next.medications = normalizedMeds;

    const normalizedMilestones = next.milestones.map((milestone) =>
      milestone.childId ? milestone : { ...milestone, childId: activeChildId },
    );
    if (
      normalizedMilestones.some(
        (milestone, index) => milestone.childId !== next.milestones[index]?.childId,
      )
    ) {
      changed = true;
    }
    next.milestones = normalizedMilestones;
  }

  if (next.dailyLogs) {
    const normalizedLogs: Record<string, import('@/types/stepio').DailyLog> = {};
    for (const [key, log] of Object.entries(next.dailyLogs)) {
      const childId = log.childId ?? activeChildId;
      const date = log.date ?? (key.includes(':') ? key.split(':')[1] : key);
      if (childId) {
        const nextKey = `${childId}:${date}`;
        if (nextKey !== key || !log.childId) {
          changed = true;
        }
        normalizedLogs[nextKey] = {
          ...log,
          childId,
          date,
        };
      } else {
        normalizedLogs[key] = log;
      }
    }
    next.dailyLogs = normalizedLogs;
  }

  return { data: next, changed };
};

const applyAdminOverride = (data: StepioData, email?: string | null) => {
  if (!adminOverrideEnabled || !email) return { data, changed: false };
  if (adminOverrideEmail && email.toLowerCase() !== adminOverrideEmail) {
    return { data, changed: false };
  }
  const isAlreadyPro = data.plan?.tier === 'pro' && data.plan?.status === 'active';
  if (isAlreadyPro) return { data, changed: false };
  return {
    data: {
      ...data,
      plan: {
        ...(data.plan ?? defaultData.plan),
        tier: 'pro',
        status: 'active',
      },
    },
    changed: true,
  };
};

export function useStepioData() {
  const { user: authUser } = useAuth();
  const [data, setData] = useState<StepioData>(() => {
    return defaultData;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!authUser) {
        setData(defaultData);
        setLoading(false);
        return;
      }
      setLoading(true);
      const ref = doc(db, 'users', authUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const loaded = snap.data() as StepioData;
        const normalized = normalizeData(loaded);
        const overridden = applyAdminOverride(normalized.data, authUser.email);
        setData(overridden.data);
        if (normalized.changed || overridden.changed) {
          await setDoc(ref, overridden.data, { merge: true });
        }
        rescheduleAll(
          overridden.data.events,
          overridden.data.medications,
          overridden.data.settings?.notifyEvents ?? true,
          overridden.data.settings?.notifyMeds ?? true,
        );
      } else {
        const initial: StepioData = {
          ...defaultData,
          user: {
            name: authUser.displayName ?? '',
            email: authUser.email ?? undefined,
          } as User,
        };
        const overridden = applyAdminOverride(initial, authUser.email);
        await setDoc(ref, overridden.data);
        setData(overridden.data);
        rescheduleAll(
          overridden.data.events,
          overridden.data.medications,
          overridden.data.settings?.notifyEvents ?? true,
          overridden.data.settings?.notifyMeds ?? true,
        );
      }
      setLoading(false);
    };
    load();
  }, [authUser]);

  const persist = useCallback(
    async (next: StepioData) => {
      if (!authUser) return;
      const ref = doc(db, 'users', authUser.uid);
      await setDoc(ref, next, { merge: true });
    },
    [authUser],
  );

  useEffect(() => {
    if (loading || !authUser) return;
    if (!isNotificationPlatformSupported()) return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(NOTIFICATIONS_PROMPT_KEY) === '1') return;

    const run = async () => {
      const language = window.localStorage.getItem("stepio.language");
      const accepted = window.confirm(
        language === "en"
          ? "Enable notifications to receive reminders for appointments and medications?"
          : "Deseja ativar notificacoes para receber lembretes de compromissos e remedios?",
      );
      window.localStorage.setItem(NOTIFICATIONS_PROMPT_KEY, '1');

      if (!accepted) {
        setData((prev) => {
          const next = {
            ...prev,
            settings: {
              notifyEvents: false,
              notifyMeds: false,
            },
          };
          persist(next);
          rescheduleAll(next.events, next.medications, false, false);
          return next;
        });
        return;
      }

      const granted = await requestNotificationPermissionOnDevice();
      if (!granted) {
        setData((prev) => {
          const next = {
            ...prev,
            settings: {
              notifyEvents: false,
              notifyMeds: false,
            },
          };
          persist(next);
          rescheduleAll(next.events, next.medications, false, false);
          return next;
        });
        const language = window.localStorage.getItem("stepio.language");
        window.alert(
          language === "en"
            ? "Notifications are disabled. You can enable them later in app settings."
            : "As notificacoes estao desativadas. Voce pode ativar depois nas configuracoes do app.",
        );
        return;
      }

      const notifyEvents = data.settings?.notifyEvents ?? true;
      const notifyMeds = data.settings?.notifyMeds ?? true;
      await rescheduleAll(data.events, data.medications, notifyEvents, notifyMeds);
    };

    void run();
  }, [authUser, data.events, data.medications, data.settings?.notifyEvents, data.settings?.notifyMeds, loading, persist]);

  const setUser = useCallback(
    (user: User) => {
      setData((prev) => {
        const next = { ...prev, user };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setChild = useCallback(
    (child: Omit<Child, 'id'> & { id?: string }) => {
      setData((prev) => {
        const resolvedId = child.id ?? resolveActiveChildId(prev) ?? createChildId();
        const nextChild = { ...child, id: resolvedId };
        const existingIndex = prev.children.findIndex((item) => item.id === resolvedId);
        const nextChildren =
          existingIndex >= 0
            ? prev.children.map((item) => (item.id === resolvedId ? nextChild : item))
            : [...prev.children, nextChild];
        const next = {
          ...prev,
          child: nextChild,
          children: nextChildren,
          activeChildId: resolvedId,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addChild = useCallback(
    (child: Omit<Child, 'id'>) => {
      setData((prev) => {
        const newChild: Child = {
          ...child,
          id: createChildId(),
        };
        const next = {
          ...prev,
          children: [...prev.children, newChild],
          activeChildId: newChild.id,
          child: newChild,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setActiveChild = useCallback(
    (childId: string) => {
      setData((prev) => {
        const selected = prev.children.find((child) => child.id === childId);
        if (!selected) return prev;
        const next = {
          ...prev,
          activeChildId: childId,
          child: selected,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const completeOnboarding = useCallback(() => {
    setData((prev) => {
      const next = { ...prev, isOnboarded: true };
      persist(next);
      return next;
    });
  }, [persist]);

  const addMedication = useCallback((medication: Omit<Medication, 'id' | 'childId'>) => {
    setData((prev) => {
      const childId = resolveActiveChildId(prev);
      if (!childId) return prev;
      const newMed: Medication = {
        ...medication,
        id: crypto.randomUUID(),
        childId,
      };
      const next = {
        ...prev,
        medications: [...prev.medications, newMed],
      };
      persist(next);
      if (next.settings?.notifyMeds) {
        scheduleMedicationNotifications(newMed);
      }
      return next;
    });
  }, [persist]);

  const updateMedication = useCallback((id: string, medication: Partial<Medication>) => {
    setData((prev) => {
      const existing = prev.medications.find((m) => m.id === id);
      const next = {
        ...prev,
        medications: prev.medications.map((m) =>
          m.id === id ? { ...m, ...medication } : m
        ),
      };
      persist(next);
      const updated = next.medications.find((m) => m.id === id);
      if (existing) {
        cancelMedicationNotifications(existing);
      }
      if (updated && next.settings?.notifyMeds) {
        scheduleMedicationNotifications(updated);
      }
      return next;
    });
  }, [persist]);

  const deleteMedication = useCallback((id: string) => {
    setData((prev) => {
      const existing = prev.medications.find((m) => m.id === id);
      const next = {
        ...prev,
        medications: prev.medications.filter((m) => m.id !== id),
      };
      persist(next);
      if (existing) {
        cancelMedicationNotifications(existing);
      }
      return next;
    });
  }, [persist]);

  const addEvent = useCallback((event: Omit<Event, 'id' | 'childId'>) => {
    setData((prev) => {
      const childId = resolveActiveChildId(prev);
      if (!childId) return prev;
      const newEvent: Event = {
        ...event,
        id: crypto.randomUUID(),
        childId,
      };
      const next = {
        ...prev,
        events: [...prev.events, newEvent],
      };
      persist(next);
      if (next.settings?.notifyEvents) {
        scheduleEventNotifications(newEvent);
      }
      return next;
    });
  }, [persist]);

  const updateEvent = useCallback((id: string, event: Partial<Event>) => {
    setData((prev) => {
      const existing = prev.events.find((e) => e.id === id);
      const next = {
        ...prev,
        events: prev.events.map((e) =>
          e.id === id ? { ...e, ...event } : e
        ),
      };
      persist(next);
      const updated = next.events.find((e) => e.id === id);
      if (existing) {
        cancelEventNotifications(existing);
      }
      if (updated && next.settings?.notifyEvents) {
        scheduleEventNotifications(updated);
      }
      return next;
    });
  }, [persist]);

  const deleteEvent = useCallback((id: string) => {
    setData((prev) => {
      const existing = prev.events.find((e) => e.id === id);
      const next = {
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
      };
      persist(next);
      if (existing) {
        cancelEventNotifications(existing);
      }
      return next;
    });
  }, [persist]);

  const setNotificationSettings = useCallback(
    (settings: { notifyEvents: boolean; notifyMeds: boolean }) => {
      setData((prev) => {
        const next: StepioData = {
          ...prev,
          settings,
        };
        persist(next);

        const wantsNotifications = settings.notifyEvents || settings.notifyMeds;
        if (!wantsNotifications) {
          rescheduleAll(next.events, next.medications, false, false);
          return next;
        }

        if (!isNotificationPlatformSupported()) {
          rescheduleAll(
            next.events,
            next.medications,
            settings.notifyEvents,
            settings.notifyMeds,
          );
          return next;
        }

        requestNotificationPermissionOnDevice().then((granted) => {
          if (!granted) {
            const disabledNext: StepioData = {
              ...next,
              settings: {
                notifyEvents: false,
                notifyMeds: false,
              },
            };
            setData(disabledNext);
            persist(disabledNext);
            rescheduleAll(disabledNext.events, disabledNext.medications, false, false);
            return;
          }
          rescheduleAll(
            next.events,
            next.medications,
            settings.notifyEvents,
            settings.notifyMeds,
          );
        });

        return next;
      });
    },
    [persist],
  );

  const addMilestone = useCallback((milestone: Omit<Milestone, 'id' | 'childId'>) => {
    setData((prev) => {
      const childId = resolveActiveChildId(prev);
      if (!childId) return prev;
      const newMilestone: Milestone = {
        ...milestone,
        id: crypto.randomUUID(),
        childId,
      };
      const next = {
        ...prev,
        milestones: [...prev.milestones, newMilestone],
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateMilestone = useCallback((id: string, milestone: Partial<Milestone>) => {
    setData((prev) => {
      const next = {
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === id ? { ...m, ...milestone } : m
        ),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteMilestone = useCallback((id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== id),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const setDailyLog = useCallback(
    (date: string, log: Omit<import('@/types/stepio').DailyLog, 'date' | 'childId'>) => {
      setData((prev) => {
        const childId = resolveActiveChildId(prev);
        if (!childId) return prev;
        const key = `${childId}:${date}`;
        const nextLogs = {
          ...(prev.dailyLogs ?? {}),
          [key]: {
            ...(prev.dailyLogs?.[key] ?? {}),
            ...log,
            date,
            childId,
            updatedAt: new Date().toISOString(),
          },
        };
        const next = {
          ...prev,
          dailyLogs: nextLogs,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const generateTherapyPlan = useCallback(
    (childId: string, autoGoals: Omit<TherapyGoal, 'id' | 'done'>[]) => {
      setData((prev) => {
        const existing = prev.therapyPlans?.[childId];
        const customGoals = existing?.goals.filter((goal) => goal.source === 'custom') ?? [];
        const nextGoals: TherapyGoal[] = [
          ...autoGoals.map((goal) => ({
            ...goal,
            id: crypto.randomUUID(),
            done: false,
          })),
          ...customGoals,
        ];
        const nextPlans = {
          ...(prev.therapyPlans ?? {}),
          [childId]: {
            childId,
            generatedAt: new Date().toISOString(),
            goals: nextGoals,
          },
        };
        const next = {
          ...prev,
          therapyPlans: nextPlans,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addTherapyGoal = useCallback(
    (childId: string, text: string) => {
      setData((prev) => {
        const existing = prev.therapyPlans?.[childId];
        const nextGoals = [
          ...(existing?.goals ?? []),
          {
            id: crypto.randomUUID(),
            text,
            done: false,
            source: 'custom' as const,
          },
        ];
        const nextPlans = {
          ...(prev.therapyPlans ?? {}),
          [childId]: {
            childId,
            generatedAt: existing?.generatedAt ?? new Date().toISOString(),
            goals: nextGoals,
          },
        };
        const next = {
          ...prev,
          therapyPlans: nextPlans,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleTherapyGoal = useCallback(
    (childId: string, goalId: string) => {
      setData((prev) => {
        const existing = prev.therapyPlans?.[childId];
        if (!existing) return prev;
        const nextGoals = existing.goals.map((goal) =>
          goal.id === goalId ? { ...goal, done: !goal.done } : goal,
        );
        const nextPlans = {
          ...(prev.therapyPlans ?? {}),
          [childId]: {
            ...existing,
            goals: nextGoals,
          },
        };
        const next = {
          ...prev,
          therapyPlans: nextPlans,
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const refreshPlan = useCallback(async () => {
    if (!authUser) return;
    const ref = doc(db, 'users', authUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const loaded = snap.data() as StepioData;
    setData((prev) => ({
      ...prev,
      plan: {
        ...defaultData.plan,
        ...(loaded.plan ?? {}),
      },
    }));
  }, [authUser]);

  const resetData = useCallback(() => {
    setData(defaultData);
    persist(defaultData);
  }, [persist]);

  return {
    data,
    loading,
    setUser,
    setChild,
    addChild,
    setActiveChild,
    completeOnboarding,
    setNotificationSettings,
    addMedication,
    updateMedication,
    deleteMedication,
    addEvent,
    updateEvent,
    deleteEvent,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    setDailyLog,
    generateTherapyPlan,
    addTherapyGoal,
    toggleTherapyGoal,
    refreshPlan,
    resetData,
  };
}
