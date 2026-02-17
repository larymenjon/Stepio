import { Event } from '@/types/stepio';
import { Calendar, Stethoscope, GraduationCap, Brain, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow, startOfDay, addDays, isBefore, isAfter, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage, getDateLocale } from '@/i18n';

interface WeekAgendaProps {
  events: Event[];
}

const eventIcons = {
  therapy: Brain,
  doctor: Stethoscope,
  school: GraduationCap,
};

const eventColors = {
  therapy: 'bg-purple-100 text-purple-600',
  doctor: 'bg-blue-100 text-blue-600',
  school: 'bg-amber-100 text-amber-600',
};

export function WeekAgenda({ events }: WeekAgendaProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const now = new Date();
  const weekEnd = addDays(startOfDay(now), 7);

  const upcomingEvents = events
    .filter((event) => {
      const eventDate = parseISO(event.datetime);
      return isAfter(eventDate, now) && isBefore(eventDate, weekEnd);
    })
    .sort((a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime())
    .slice(0, 3);

  const formatEventDate = (datetime: string) => {
    const date = parseISO(datetime);
    if (isToday(date)) return byLanguage(language, `Hoje, ${format(date, 'HH:mm')}`, `Today, ${format(date, 'HH:mm')}`);
    if (isTomorrow(date)) return byLanguage(language, `Amanha, ${format(date, 'HH:mm')}`, `Tomorrow, ${format(date, 'HH:mm')}`);
    return format(date, language === 'en' ? 'EEE, MMM dd' : "EEE, dd 'de' MMM", { locale: getDateLocale(language) });
  };

  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          {byLanguage(language, 'Esta semana', 'This week')}
        </h3>
        <button
          onClick={() => navigate('/agenda')}
          className="text-sm text-primary font-medium flex items-center gap-1"
        >
          {byLanguage(language, 'Ver tudo', 'View all')}
          <ChevronRight size={16} />
        </button>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="stepio-card text-center py-6">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">{byLanguage(language, 'Nenhum evento esta semana', 'No events this week')}</p>
          <button
            onClick={() => navigate('/agenda')}
            className="mt-3 text-sm text-primary font-medium"
          >
            {byLanguage(language, '+ Adicionar evento', '+ Add event')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map((event) => {
            const Icon = eventIcons[event.type];
            const colorClass = eventColors[event.type];

            return (
              <div key={event.id} className="stepio-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatEventDate(event.datetime)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}