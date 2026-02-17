import { getDailyQuote } from '@/utils/motivationalQuotes';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage } from '@/i18n';

export function MotivationalFooter() {
  const { language } = useLanguage();
  const quote = getDailyQuote(language);

  return (
    <div className="text-center py-6 px-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="inline-flex items-center gap-1 text-primary mb-2">
        <Heart size={14} fill="currentColor" />
        <span className="text-xs font-medium">{byLanguage(language, 'Frase do dia', 'Quote of the day')}</span>
        <Heart size={14} fill="currentColor" />
      </div>
      <p className="text-muted-foreground italic">"{quote}"</p>
    </div>
  );
}