import { User, Child } from '@/types/stepio';
import { calculateAge } from '@/utils/ageCalculator';
import { Calendar, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage } from '@/i18n';

interface HeroCardProps {
  user: User;
  child: Child;
}

function getGreeting(language: 'pt-BR' | 'en'): string {
  const hour = new Date().getHours();
  if (hour < 12) return byLanguage(language, 'Bom dia', 'Good morning');
  if (hour < 18) return byLanguage(language, 'Boa tarde', 'Good afternoon');
  return byLanguage(language, 'Boa noite', 'Good evening');
}

export function HeroCard({ user, child }: HeroCardProps) {
  const { language } = useLanguage();
  const age = calculateAge(child.birthDate);
  const greeting = getGreeting(language);
  const initials = `${user.name?.trim().charAt(0) ?? ''}${child.name?.trim().charAt(0) ?? ''}`.toUpperCase();

  return (
    <div className="stepio-hero-gradient rounded-3xl p-5 text-primary-foreground animate-slide-up">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl overflow-hidden">
          <span className="font-bold">{initials || 'LC'}</span>
        </div>
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium">{greeting},</p>
          <h2 className="text-xl font-bold">
            {user.name} & {child.name}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar size={18} className="text-white/80" />
            <span className="text-white/80 text-xs font-medium">{byLanguage(language, 'Meses', 'Months')}</span>
          </div>
          <p className="text-3xl font-bold">{age.months}</p>
          <p className="text-xs text-white/70">{byLanguage(language, 'meses de vida', 'months old')}</p>
        </div>

        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock size={18} className="text-white/80" />
            <span className="text-white/80 text-xs font-medium">{byLanguage(language, 'Semanas', 'Weeks')}</span>
          </div>
          <p className="text-3xl font-bold">{age.weeks}</p>
          <p className="text-xs text-white/70">{byLanguage(language, 'semanas de vida', 'weeks old')}</p>
        </div>
      </div>
    </div>
  );
}