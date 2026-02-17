import { useState } from 'react';
import { Baby, Calendar } from 'lucide-react';
import { format, parse, isValid as isValidDate } from 'date-fns';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage, getDateLocale } from '@/i18n';

interface WizardStep2Props {
  onNext: (childName: string, birthDate: string, gender: 'menina' | 'menino' | 'nao_informar') => void;
  onBack: () => void;
}

export function WizardStep2({ onNext, onBack }: WizardStep2Props) {
  const { language } = useLanguage();
  const [childName, setChildName] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<'menina' | 'menino' | 'nao_informar'>('nao_informar');

  const handleDateChange = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length > 2) formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    if (formatted.length > 5) formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
    setBirthDateInput(formatted);

    if (formatted.length === 10) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValidDate(parsed) && parsed <= new Date()) setBirthDate(parsed);
      else setBirthDate(null);
    } else {
      setBirthDate(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (childName.trim() && birthDate) onNext(childName.trim(), birthDate.toISOString(), gender);
  };

  const isFormValid = childName.trim() && birthDate;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Baby className="w-10 h-10 text-primary" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center mb-2">{byLanguage(language, 'Conte sobre seu pequeno', 'Tell us about your child')}</h1>
      <p className="text-muted-foreground text-center mb-8">{byLanguage(language, 'Essas informacoes nos ajudam a personalizar a experiencia', 'This helps us personalize your experience')}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Nome da crianca', 'Child name')}</label>
          <div className="relative">
            <Baby className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder={byLanguage(language, 'Nome do seu filho(a)', "Your child's name")} className="stepio-input w-full pl-12" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Data de nascimento', 'Birth date')}</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" value={birthDateInput} onChange={(e) => handleDateChange(e.target.value)} placeholder="DD/MM/YYYY" maxLength={10} inputMode="numeric" className="stepio-input w-full pl-12" />
          </div>
          {birthDate && <p className="text-sm text-primary mt-2 font-medium">{format(birthDate, language === 'en' ? 'MMMM dd, yyyy' : "dd 'de' MMMM 'de' yyyy", { locale: getDateLocale(language) })}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Genero', 'Gender')}</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'menina', label: byLanguage(language, 'Menina', 'Girl') },
              { id: 'menino', label: byLanguage(language, 'Menino', 'Boy') },
              { id: 'nao_informar', label: byLanguage(language, 'Prefiro nao dizer', 'Prefer not to say') },
            ] as const).map((option) => (
              <button key={option.id} type="button" onClick={() => setGender(option.id)} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${gender === option.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="flex-1 py-4 rounded-2xl border-2 border-border text-foreground font-bold text-lg transition-all duration-200 active:scale-[0.98]">{byLanguage(language, 'Voltar', 'Back')}</button>
          <button type="submit" disabled={!isFormValid} className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">{byLanguage(language, 'Continuar', 'Continue')}</button>
        </div>
      </form>
    </div>
  );
}