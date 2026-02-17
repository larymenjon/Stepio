import { useState } from 'react';
import { Plus, Trophy, Star, X } from 'lucide-react';
import { Milestone } from '@/types/stepio';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MarcosProps {
  milestones: Milestone[];
  onAdd: (milestone: Omit<Milestone, 'id'>) => void;
  onDelete: (id: string) => void;
}

export function Marcos({ milestones, onAdd, onDelete }: MarcosProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const sortedMilestones = [...milestones].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title) {
      onAdd({
        title: formData.title,
        description: formData.description || undefined,
        date: formData.date,
      });
      setFormData({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setShowForm(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl font-bold">Marcos 🏆</h1>
        <p className="text-muted-foreground">Celebre cada conquista!</p>
      </header>

      <main className="px-4">
        {sortedMilestones.length === 0 ? (
          <div className="stepio-card text-center py-8">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">Nenhum marco registrado</p>
            <p className="text-sm text-muted-foreground">
              Registre as conquistas do seu pequeno!
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-primary/20" />

            <div className="space-y-4">
              {sortedMilestones.map((milestone, index) => (
                <div key={milestone.id} className="relative flex gap-4 animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  {/* Timeline dot */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Star size={18} className="text-primary-foreground" fill="currentColor" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 stepio-card">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-lg">{milestone.title}</p>
                        {milestone.description && (
                          <p className="text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        <p className="text-sm text-primary font-medium mt-2">
                          {format(parseISO(milestone.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <button
                        onClick={() => onDelete(milestone.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => setShowForm(true)} className="stepio-fab">
        <Plus size={28} />
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-background w-full max-w-md rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nova Conquista 🎉</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">O que aconteceu?</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Falou mamãe pela primeira vez!"
                  className="stepio-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Detalhes (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Conte mais sobre esse momento especial..."
                  rows={3}
                  className="stepio-input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Quando foi?</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="stepio-input w-full"
                />
              </div>

              <button
                type="submit"
                disabled={!formData.title}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 disabled:opacity-50"
              >
                Registrar Conquista 🌟
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
