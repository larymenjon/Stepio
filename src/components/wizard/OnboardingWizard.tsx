import { useState } from 'react';
import { WizardStep1 } from './WizardStep1';
import { WizardStep2 } from './WizardStep2';
import { WizardStep3 } from './WizardStep3';
import { ConditionType } from '@/types/stepio';
import stepioLogo from '@/assets/stepio-logo.png';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage } from '@/i18n';

interface OnboardingWizardProps {
  onComplete: (data: {
    userName: string;
    childName: string;
    birthDate: string;
    gender: 'menina' | 'menino' | 'nao_informar';
    conditions: ConditionType[];
  }) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'menina' | 'menino' | 'nao_informar'>('nao_informar');

  const handleStep1 = (name: string) => {
    setUserName(name);
    setStep(2);
  };

  const handleStep2 = (name: string, date: string, selectedGender: 'menina' | 'menino' | 'nao_informar') => {
    setChildName(name);
    setBirthDate(date);
    setGender(selectedGender);
    setStep(3);
  };

  const handleStep3 = (conditions: ConditionType[]) => {
    onComplete({
      userName,
      childName,
      birthDate,
      gender,
      conditions,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 flex items-center justify-center gap-2">
        <img src={stepioLogo} alt="Stepio" className="w-12 h-12 object-contain" />
        <span className="text-xl font-bold text-primary">Stepio</span>
      </div>

      <div className="px-6 mb-6">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center mt-2">{byLanguage(language, `Passo ${step} de 3`, `Step ${step} of 3`)}</p>
      </div>

      <div className="flex-1 px-6 pb-8">
        {step === 1 && <WizardStep1 onNext={handleStep1} />}
        {step === 2 && <WizardStep2 onNext={handleStep2} onBack={() => setStep(1)} />}
        {step === 3 && <WizardStep3 childName={childName} onComplete={handleStep3} onBack={() => setStep(2)} />}
      </div>
    </div>
  );
}