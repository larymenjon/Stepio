import { useStepioData } from '@/hooks/useStepioData';
import { OnboardingWizard } from '@/components/wizard/OnboardingWizard';
import { Home } from './Home';
import { Medicacao } from './Medicacao';
import { Agenda } from './Agenda';
import { Terapias } from './Terapias';
import { BottomNav } from '@/components/BottomNav';
import { useLocation } from 'react-router-dom';
import { ConditionType } from '@/types/stepio';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage } from '@/i18n';

const Index = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const {
    data,
    loading,
    setUser,
    setChild,
    completeOnboarding,
    addMedication,
    deleteMedication,
    addEvent,
    deleteEvent,
    addMilestone,
  } = useStepioData();
  const activeChildId = data.activeChildId ?? data.child?.id ?? null;
  const activeEvents = activeChildId
    ? data.events.filter((event) => event.childId === activeChildId)
    : data.events;
  const activeMedications = activeChildId
    ? data.medications.filter((med) => med.childId === activeChildId)
    : data.medications;
  const activeLogs = activeChildId
    ? Object.values(data.dailyLogs ?? {}).filter((log) => log.childId === activeChildId)
    : [];
  const activeMilestones = activeChildId
    ? data.milestones.filter((milestone) => milestone.childId === activeChildId)
    : data.milestones;

  const handleOnboardingComplete = (onboardingData: {
    userName: string;
    childName: string;
    birthDate: string;
    gender: 'menina' | 'menino' | 'nao_informar';
    conditions: ConditionType[];
  }) => {
    setUser({ name: onboardingData.userName });
    setChild({
      name: onboardingData.childName,
      birthDate: onboardingData.birthDate,
      condition: onboardingData.conditions,
      gender: onboardingData.gender,
    });
    completeOnboarding();
  };

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{byLanguage(language, 'Carregando...', 'Loading...')}</div>
      </div>
    );
  }

  if (!data.isOnboarded || !data.user || !data.child) {
    return (
      <div className="mobile-container">
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const renderPage = () => {
    switch (location.pathname) {
      case '/medicacao':
        return (
          <Medicacao
            medications={activeMedications}
            onAdd={addMedication}
            onDelete={deleteMedication}
          />
        );
      case '/agenda':
        return (
          <Agenda
            events={activeEvents}
            onAdd={addEvent}
            onDelete={deleteEvent}
          />
        );
      case '/marcos':
        return (
          <Terapias
            events={activeEvents}
            onAdd={addEvent}
            onDelete={deleteEvent}
          />
        );
      case '/terapias':
        return (
          <Terapias
            events={activeEvents}
            onAdd={addEvent}
            onDelete={deleteEvent}
          />
        );
      default:
        return (
          <Home
            user={data.user}
            child={data.child}
            medications={activeMedications}
            events={activeEvents}
            dailyLogs={activeLogs}
            milestones={activeMilestones}
            onAddMilestone={addMilestone}
            plan={data.plan}
          />
        );
    }
  };

  return (
    <div className="mobile-container">
      {renderPage()}
      <BottomNav />
    </div>
  );
};

export default Index;