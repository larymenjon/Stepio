import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Brain, Stethoscope, GraduationCap, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types/stepio';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage, getDateLocale, getEventTypeLabel } from '@/i18n';

interface AgendaProps {
  events: Event[];
  onAdd: (event: Omit<Event, 'id' | 'childId'>) => void;
  onDelete: (id: string) => void;
}

const eventIcons = {
  therapy: Brain,
  doctor: Stethoscope,
  school: GraduationCap,
};

const eventColors = {
  therapy: 'bg-purple-500',
  doctor: 'bg-blue-500',
  school: 'bg-amber-500',
};

const eventBgColors = {
  therapy: 'bg-purple-100 text-purple-700 border-purple-200',
  doctor: 'bg-blue-100 text-blue-700 border-blue-200',
  school: 'bg-amber-100 text-amber-700 border-amber-200',
};

export function Agenda({ events, onAdd, onDelete }: AgendaProps) {
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    professional: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    type: 'therapy' as Event['type'],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const selectedDateEvents = events.filter((event) =>
    isSameDay(parseISO(event.datetime), selectedDate)
  );

  const hasEventsOnDay = (date: Date) =>
    events.some((event) => isSameDay(parseISO(event.datetime), date));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.title) {
      const datetime = `${formData.date}T${formData.time}:00`;
      onAdd({
        title: formData.title,
        professional: formData.professional || undefined,
        datetime,
        type: formData.type,
      });
      setFormData({
        title: '',
        professional: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        type: 'therapy',
      });
      setShowForm(false);
    }
  };

  const weekdayLabels = language === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="pb-24">
      <header className="stepio-header stepio-header-sm">
        <div className="stepio-header-content">
          <div className="stepio-header-card text-center">
            <h1 className="text-2xl font-bold">{byLanguage(language, 'Agenda', 'Schedule')}</h1>
            <p className="text-muted-foreground">{byLanguage(language, 'Compromissos e terapias', 'Appointments and therapies')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">
        <div className="stepio-card">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: getDateLocale(language) })}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdayLabels.map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={i} />;

              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasEvents = hasEventsOnDay(day);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative',
                    isSelected && 'bg-primary text-primary-foreground',
                    !isSelected && isToday && 'bg-primary/10 text-primary',
                    !isSelected && !isToday && 'hover:bg-muted'
                  )}
                >
                  {format(day, 'd')}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">
            {isSameDay(selectedDate, new Date())
              ? byLanguage(language, 'Hoje', 'Today')
              : format(selectedDate, language === 'en' ? 'MMMM dd' : "dd 'de' MMMM", { locale: getDateLocale(language) })}
          </h3>

          {selectedDateEvents.length === 0 ? (
            <div className="stepio-card text-center py-6">
              <p className="text-muted-foreground">{byLanguage(language, 'Nenhum evento neste dia', 'No events on this day')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => {
                const Icon = eventIcons[event.type];
                const bgColorClass = eventBgColors[event.type];

                return (
                  <div key={event.id} className={cn('stepio-card border-l-4', bgColorClass)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{event.title}</p>
                        {event.professional && (
                          <p className="text-sm opacity-80">{event.professional}</p>
                        )}
                        <p className="text-sm font-medium">
                          {format(parseISO(event.datetime), 'HH:mm')}
                        </p>
                      </div>
                      <button
                        onClick={() => onDelete(event.id)}
                        className="p-2 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <button onClick={() => setShowForm(true)} className="stepio-fab">
        <Plus size={28} />
      </button>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{byLanguage(language, 'Novo evento', 'New event')}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Tipo', 'Type')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['therapy', 'doctor', 'school'] as const).map((type) => {
                    const Icon = eventIcons[type];
                    const colorClass = eventColors[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={cn(
                          'p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                          formData.type === type
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', colorClass)}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <span className="text-xs">{getEventTypeLabel(type, language)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Titulo', 'Title')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={byLanguage(language, 'Ex: Terapia Ocupacional', 'Ex: Occupational Therapy')}
                  className="stepio-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Profissional (opcional)', 'Professional (optional)')}</label>
                <input
                  type="text"
                  value={formData.professional}
                  onChange={(e) => setFormData({ ...formData, professional: e.target.value })}
                  placeholder={byLanguage(language, 'Ex: Dra. Maria', 'Ex: Dr. Maria')}
                  className="stepio-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Data', 'Date')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="stepio-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Horario', 'Time')}</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="stepio-input w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.title}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 disabled:opacity-50"
              >
                {byLanguage(language, 'Salvar evento', 'Save event')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}