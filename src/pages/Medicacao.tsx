import { useState } from 'react';
import { Plus, Pill, Droplet, CircleDot, X, Clock } from 'lucide-react';
import { Medication } from '@/types/stepio';
import { getMedicationSchedule } from '@/utils/medicationUtils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { byLanguage, getFrequencyLabel, getMedicationTypeLabel } from '@/i18n';

interface MedicacaoProps {
  medications: Medication[];
  onAdd: (medication: Omit<Medication, 'id' | 'childId'>) => void;
  onDelete: (id: string) => void;
}

const typeIcons = {
  xarope: Droplet,
  comprimido: Pill,
  gotas: CircleDot,
  pomada: CircleDot,
};

const typeColors = {
  xarope: 'bg-pink-100 text-pink-600',
  comprimido: 'bg-blue-100 text-blue-600',
  gotas: 'bg-amber-100 text-amber-600',
  pomada: 'bg-green-100 text-green-600',
};

export function Medicacao({ medications, onAdd, onDelete }: MedicacaoProps) {
  const { language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'xarope' as Medication['type'],
    dosage: '',
    frequency: 'diario' as Medication['frequency'],
    startTime: '08:00',
    extraTimes: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.dosage) {
      onAdd(formData);
      setFormData({
        name: '',
        type: 'xarope',
        dosage: '',
        frequency: 'diario',
        startTime: '08:00',
        extraTimes: [],
      });
      setShowForm(false);
    }
  };

  return (
    <div className="pb-24">
      <header className="stepio-header stepio-header-sm">
        <div className="stepio-header-content">
          <div className="stepio-header-card text-center">
            <h1 className="text-2xl font-bold">{byLanguage(language, 'Medicacoes', 'Medications')}</h1>
            <p className="text-muted-foreground">{byLanguage(language, 'Gerencie os remedios do seu pequeno', "Manage your child's medicines")}</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-3">
        {medications.length === 0 ? (
          <div className="stepio-card text-center py-8">
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">{byLanguage(language, 'Nenhuma medicacao cadastrada', 'No medication added')}</p>
            <p className="text-sm text-muted-foreground">
              {byLanguage(language, 'Toque no + para adicionar', 'Tap + to add')}
            </p>
          </div>
        ) : (
          medications.map((med) => {
            const Icon = typeIcons[med.type];
            const colorClass = typeColors[med.type];
            const schedule = getMedicationSchedule(med);

            return (
              <div key={med.id} className="stepio-card">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{med.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage} - {getMedicationTypeLabel(med.type, language)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{getFrequencyLabel(med.frequency, language)}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>{schedule.join(', ')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(med.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      <button
        onClick={() => setShowForm(true)}
        className="stepio-fab"
      >
        <Plus size={28} />
      </button>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{byLanguage(language, 'Nova medicacao', 'New medication')}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Nome do remedio', 'Medicine name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={byLanguage(language, 'Ex: Risperidona', 'Ex: Risperidone')}
                  className="stepio-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Tipo', 'Type')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['xarope', 'comprimido', 'gotas', 'pomada'] as const).map((type) => {
                    const Icon = typeIcons[type];
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
                        <Icon size={20} />
                        <span className="text-xs">{getMedicationTypeLabel(type, language)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Dosagem', 'Dosage')}</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder={byLanguage(language, 'Ex: 5ml ou 1 comprimido', 'Ex: 5ml or 1 tablet')}
                  className="stepio-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Frequencia', 'Frequency')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['diario', '6h', '8h', '12h', 'sob_demanda'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFormData({ ...formData, frequency: freq })}
                      className={cn(
                        'p-3 rounded-xl border-2 text-sm font-medium transition-all',
                        formData.frequency === freq
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      )}
                    >
                      {getFrequencyLabel(freq, language)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Horario inicial', 'Start time')}</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="stepio-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{byLanguage(language, 'Horarios adicionais', 'Additional times')}</label>
                <div className="space-y-2">
                  {formData.extraTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const next = [...formData.extraTimes];
                          next[index] = e.target.value;
                          setFormData({ ...formData, extraTimes: next });
                        }}
                        className="stepio-input w-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = formData.extraTimes.filter((_, i) => i !== index);
                          setFormData({ ...formData, extraTimes: next });
                        }}
                        className="px-3 py-2 rounded-xl border border-border text-sm"
                      >
                        {byLanguage(language, 'Remover', 'Remove')}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, extraTimes: [...formData.extraTimes, '12:00'] })}
                    className="w-full py-2 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-primary"
                  >
                    {byLanguage(language, '+ Adicionar horario', '+ Add time')}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.name || !formData.dosage}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 disabled:opacity-50"
              >
                {byLanguage(language, 'Salvar medicacao', 'Save medication')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
