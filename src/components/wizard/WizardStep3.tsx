import { useMemo, useState } from 'react';
import { Puzzle, Check, ChevronDown, Plus } from 'lucide-react';
import { ConditionType, conditionOptions } from '@/types/stepio';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage, getConditionLabel } from '@/i18n';

interface WizardStep3Props {
  childName: string;
  onComplete: (conditions: ConditionType[]) => void;
  onBack: () => void;
}

export function WizardStep3({ childName, onComplete, onBack }: WizardStep3Props) {
  const { language } = useLanguage();
  const [selected, setSelected] = useState<ConditionType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  const toggleCondition = (condition: ConditionType) => {
    setSelected((prev) => (prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]));
  };

  const options = useMemo(() => {
    const mapped = conditionOptions.map((opt) => ({ id: opt.id, label: getConditionLabel(opt.id, language) }));
    const extra = customOptions.map((opt) => ({ id: opt, label: opt }));
    return [...mapped, ...extra];
  }, [customOptions, language]);

  const addCustom = () => {
    const value = customInput.trim();
    if (!value) return;
    if (!customOptions.includes(value)) setCustomOptions((prev) => [...prev, value]);
    if (!selected.includes(value)) setSelected((prev) => [...prev, value]);
    setCustomInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(selected);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Puzzle className="w-10 h-10 text-primary" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center mb-2">{byLanguage(language, `Sobre ${childName}`, `About ${childName}`)}</h1>
      <p className="text-muted-foreground text-center mb-8">{byLanguage(language, 'Selecione as condicoes que se aplicam (opcional)', 'Select applicable conditions (optional)')}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="stepio-card">
          <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="w-full flex items-center justify-between py-3 font-semibold">
            <span>{byLanguage(language, 'Selecionar condicoes', 'Select conditions')}</span>
            <ChevronDown size={18} className={cn('transition-transform', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-2">
                {options.map((option) => {
                  const isSelected = selected.includes(option.id);
                  return (
                    <button key={option.id} type="button" onClick={() => toggleCondition(option.id)} className={cn('w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left', isSelected ? 'border-primary bg-primary/5' : 'border-border')}>
                      <span className="text-sm font-medium">{option.label}</span>
                      {isSelected && <Check size={16} className="text-primary" />}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Adicionar outra condicao', 'Add another condition')}</label>
                <div className="flex gap-2">
                  <input type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder={byLanguage(language, 'Ex: Paralisia cerebral infantil', 'Ex: Cerebral palsy')} className="stepio-input w-full" />
                  <button type="button" onClick={addCustom} className="px-4 rounded-2xl bg-primary text-primary-foreground" aria-label={byLanguage(language, 'Adicionar condicao', 'Add condition')}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {selected.map((condition) => (
              <span key={condition} className="stepio-chip stepio-chip-selected">{getConditionLabel(condition, language)}</span>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">{byLanguage(language, 'Voce pode pular esta etapa se preferir', 'You can skip this step if you prefer')}</p>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="flex-1 py-4 rounded-2xl border-2 border-border text-foreground font-bold text-lg transition-all duration-200 active:scale-[0.98]">{byLanguage(language, 'Voltar', 'Back')}</button>
          <button type="submit" className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 active:scale-[0.98]">{byLanguage(language, 'Comecar', 'Start')}</button>
        </div>
      </form>
    </div>
  );
}