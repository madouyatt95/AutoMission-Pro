import { useState } from 'react';
import { Plus, Check, Bell, RefreshCw, Calendar } from 'lucide-react';
import { useRappelStore, useClientStore } from '../store';
import { ReminderRepeat } from '../types';

export default function Rappels() {
  const { rappels, addRappel, toggleComplete, deleteRappel } = useRappelStore();
  const { clients } = useClientStore();
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active');
  const [form, setForm] = useState({ titre: '', date: new Date().toISOString().split('T')[0], repetition: 'unique' as ReminderRepeat, vehiculePlaque: '', clientId: '' });

  const today = new Date().toISOString().split('T')[0];

  let filtered = [...rappels].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (filter === 'active') filtered = filtered.filter(r => !r.completed);
  if (filter === 'done') filtered = filtered.filter(r => r.completed);

  const overdue = filtered.filter(r => r.date < today && !r.completed);
  const todayItems = filtered.filter(r => r.date === today && !r.completed);
  const upcoming = filtered.filter(r => r.date > today && !r.completed);
  const completed = filtered.filter(r => r.completed);

  const handleAdd = () => {
    if (!form.titre.trim() || !form.date) return;
    addRappel({ ...form, vehiculePlaque: form.vehiculePlaque || undefined, clientId: form.clientId || undefined });
    setForm({ titre: '', date: new Date().toISOString().split('T')[0], repetition: 'unique', vehiculePlaque: '', clientId: '' });
    setAdding(false);
  };

  const repLabels: Record<ReminderRepeat, string> = { unique: 'Unique', hebdomadaire: 'Hebdo', mensuelle: 'Mensuel' };

  const renderCard = (r: typeof rappels[0]) => {
    const isOverdue = r.date < today && !r.completed;
    const isToday = r.date === today;
    return (
      <div key={r.id} className={`reminder-card ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''} ${r.completed ? 'completed' : ''}`}>
        <button className={`reminder-check ${r.completed ? 'done' : ''}`} onClick={() => toggleComplete(r.id)}>
          {r.completed && <Check size={14} />}
        </button>
        <div className="reminder-info">
          <div className="reminder-title" style={r.completed ? { textDecoration: 'line-through' } : {}}>{r.titre}</div>
          <div className="reminder-date" style={isOverdue ? { color: 'var(--red)' } : isToday ? { color: 'var(--orange)' } : {}}>
            <Calendar size={11} /> {new Date(r.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            {r.vehiculePlaque && ` • ${r.vehiculePlaque}`}
          </div>
        </div>
        {r.repetition !== 'unique' && <span className="reminder-tag"><RefreshCw size={10} /> {repLabels[r.repetition]}</span>}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Rappels</h1>
        <p className="page-subtitle">{rappels.filter(r => !r.completed).length} actif{rappels.filter(r => !r.completed).length > 1 ? 's' : ''}</p>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        <button className={`filter-tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Actifs</button>
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tous</button>
        <button className={`filter-tab ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>Terminés</button>
      </div>

      {overdue.length > 0 && filter !== 'done' && (
        <div className="section">
          <h3 className="section-title" style={{ color: 'var(--red)', marginBottom: 8 }}>⚠️ En retard ({overdue.length})</h3>
          {overdue.map(renderCard)}
        </div>
      )}

      {todayItems.length > 0 && filter !== 'done' && (
        <div className="section">
          <h3 className="section-title" style={{ color: 'var(--orange)', marginBottom: 8 }}>Aujourd'hui ({todayItems.length})</h3>
          {todayItems.map(renderCard)}
        </div>
      )}

      {upcoming.length > 0 && filter !== 'done' && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 8 }}>À venir ({upcoming.length})</h3>
          {upcoming.map(renderCard)}
        </div>
      )}

      {completed.length > 0 && filter !== 'active' && (
        <div className="section">
          <h3 className="section-title" style={{ marginBottom: 8, color: 'var(--text3)' }}>Terminés ({completed.length})</h3>
          {completed.map(renderCard)}
        </div>
      )}

      {filtered.length === 0 && <div className="empty-state"><Bell size={48} /><p>Aucun rappel</p></div>}

      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 className="modal-title">Nouveau rappel</h3>
            <div className="input-group"><label className="input-label">Titre *</label><input className="input" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} autoFocus /></div>
            <div className="input-group"><label className="input-label">Date</label><input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Répétition</label>
              <div className="chips">{(['unique', 'hebdomadaire', 'mensuelle'] as ReminderRepeat[]).map(r => (<button key={r} className={`chip ${form.repetition === r ? 'active' : ''}`} onClick={() => setForm({ ...form, repetition: r })}>{repLabels[r]}</button>))}</div>
            </div>
            <div className="input-group"><label className="input-label">Véhicule (optionnel)</label><input className="input" placeholder="AB-123-CD" value={form.vehiculePlaque} onChange={e => setForm({ ...form, vehiculePlaque: e.target.value.toUpperCase() })} /></div>
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Créer le rappel</button>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setAdding(true)}><Plus /></button>
    </div>
  );
}
