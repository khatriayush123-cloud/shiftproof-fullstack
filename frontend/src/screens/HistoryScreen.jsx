import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { useShift } from '../context/ShiftContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AppShell from '../components/AppShell.jsx';
import Card from '../components/Card.jsx';
import FortnightMeter from '../components/FortnightMeter.jsx';
import AppButton from '../components/AppButton.jsx';
import ShiftCard from '../components/ShiftCard.jsx';
import PayBreakdown from '../components/PayBreakdown.jsx';
import BackLink from '../components/BackLink.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import { formatCurrency, pluralise } from '../lib/pay.js';
import { formatDate, getDayOfWeek, formatDateRange } from '../lib/date.js';

/**
 * Buckets shifts under the server's 14-day period windows (summary.periods),
 * most recent first. The window bounds come from the server - rows are only
 * sorted into them for display. Shifts older than the six periods fall into
 * an "Older" group.
 */
function groupByPeriods(shifts, summary) {
  const buckets = summary.periods.map((p) => ({
    key: `${p.window_start}/${p.window_end}`,
    label: formatDateRange(p.window_start, p.window_end),
    windowStart: p.window_start,
    windowEnd: p.window_end,
    shifts: [],
  }));
  const older = { key: 'older', label: 'Older', windowStart: null, windowEnd: null, shifts: [] };
  for (const shift of shifts) {
    const bucket = buckets.find(
      (b) => shift.shift_date >= b.windowStart && shift.shift_date <= b.windowEnd,
    );
    (bucket ?? older).shifts.push(shift);
  }
  return [...buckets, older]
    .filter((g) => g.shifts.length > 0)
    .map((g) => ({
      ...g,
      hours: g.shifts.reduce((sum, s) => sum + s.hours, 0),
      pay: g.shifts.reduce((sum, s) => sum + s.pay, 0),
    }));
}

export default function HistoryScreen() {
  const { shifts, summary, deleteShift, updateShift, isLoading } = useShift();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [busyId, setBusyId] = useState(null);

  async function handleDelete(id) {
    if (!window.confirm('Delete this shift? This will recalculate your fortnight total.')) return;
    setBusyId(id);
    try {
      await deleteShift(id);
      addToast('Shift deleted', 'success');
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(shift) {
    setEditingId(shift.id);
    setEditForm({
      start_time: shift.start_time.slice(0, 5),
      finish_time: shift.finish_time.slice(0, 5),
    });
  }

  async function saveEdit(id) {
    // Overnight shifts are allowed: a finish time before the start time
    // means the shift crosses midnight.
    if (!editForm.start_time || !editForm.finish_time) {
      addToast('Please enter both times', 'warning');
      return;
    }
    setBusyId(id);
    try {
      await updateShift(id, { start_time: editForm.start_time, finish_time: editForm.finish_time });
      setEditingId(null);
      addToast('Shift updated', 'success');
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusyId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  const employers = useMemo(() => {
    const set = new Set(shifts.map((s) => s.employer));
    return ['All', ...set];
  }, [shifts]);

  const filtered = useMemo(
    () => (filter === 'All' ? shifts : shifts.filter((s) => s.employer === filter)),
    [shifts, filter],
  );

  const groups = useMemo(
    () => (summary ? groupByPeriods(filtered, summary) : []),
    [filtered, summary],
  );

  return (
    <AppShell title="History">
      <BackLink />
      {isLoading ? (
        <>
          <SkeletonCard className="mb-4" />
          <SkeletonCard />
        </>
      ) : shifts.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-2 mb-4">No shifts logged yet.</p>
          <AppButton onClick={() => navigate('/add-shift')}>Add your first shift</AppButton>
        </Card>
      ) : (
        <>
          {/* Employer filter chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {employers.map((emp) => (
              <button
                key={emp}
                type="button"
                onClick={() => setFilter(emp)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                  filter === emp
                    ? 'bg-teal text-white'
                    : 'bg-card border border-border text-muted hover:text-ink'
                }`}
              >
                {emp}
              </button>
            ))}
          </div>

          {/* Fortnight groups */}
          {groups.map((g) => (
            <div key={g.key} className="mb-8">
              <Card className="mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{g.label}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {pluralise(g.shifts.length, 'shift')} · {formatCurrency(g.pay)}
                    </p>
                  </div>
                  <div className="sm:w-[200px]">
                    <FortnightMeter hoursWorked={g.hours} size="compact" />
                  </div>
                </div>
              </Card>

              {/* Desktop table */}
              <Card className="hidden sm:block overflow-hidden !p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-medium text-muted px-5 py-3">Date</th>
                      <th className="text-left font-medium text-muted px-5 py-3">Employer</th>
                      <th className="text-right font-medium text-muted px-5 py-3">Hours</th>
                      <th className="text-right font-medium text-muted px-5 py-3">Pay</th>
                      <th className="text-right font-medium text-muted px-5 py-3 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.shifts.map((shift, i) => {
                      const day = getDayOfWeek(shift.shift_date);
                      const wk = day === 'saturday' || day === 'sunday';
                      const isEditing = editingId === shift.id;
                      return (
                        <tr key={shift.id} className={i % 2 === 0 ? 'bg-paper/50' : 'bg-card'}>
                          <td className="px-5 py-3 text-ink">{formatDate(shift.shift_date)}
                            {wk && <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-teal/10 text-teal">{day === 'saturday' ? 'Sat' : 'Sun'}</span>}
                          </td>
                          <td className="px-5 py-3 text-ink">{shift.employer}</td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <input type="time" value={editForm.start_time} onChange={(e) => setEditForm((p) => ({ ...p, start_time: e.target.value }))}
                                  className="w-24 rounded border border-border px-2 py-1 text-xs text-ink bg-card" />
                                <span className="text-muted">–</span>
                                <input type="time" value={editForm.finish_time} onChange={(e) => setEditForm((p) => ({ ...p, finish_time: e.target.value }))}
                                  className="w-24 rounded border border-border px-2 py-1 text-xs text-ink bg-card" />
                              </div>
                            ) : (
                              shift.hours.toFixed(1)
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-money font-medium tabular-nums">{formatCurrency(shift.pay)}</td>
                          <td className="px-5 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => saveEdit(shift.id)} disabled={busyId === shift.id} className="p-1 text-teal hover:bg-teal/10 rounded disabled:opacity-50" title="Save"><Check size={16} /></button>
                                <button type="button" onClick={cancelEdit} className="p-1 text-muted hover:bg-ink/5 rounded" title="Cancel"><X size={16} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => startEdit(shift)} className="p-1 text-muted hover:text-ink hover:bg-ink/5 rounded" title="Edit"><Pencil size={16} /></button>
                                <button type="button" onClick={() => handleDelete(shift.id)} disabled={busyId === shift.id} className="p-1 text-muted hover:text-breach hover:bg-breach/5 rounded disabled:opacity-50" title="Delete"><Trash2 size={16} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>

              {/* Mobile card list with PayBreakdown */}
              <div className="sm:hidden">
                {g.shifts.map((s) => (
                  <div key={s.id}>
                    <ShiftCard shift={s} />
                    <div className="px-5 pb-2 -mt-2">
                      <PayBreakdown breakdown={s.breakdown} pay={s.pay} hours={s.hours} />
                    </div>
                    <div className="flex gap-2 px-5 pb-3">
                      <button type="button" onClick={() => startEdit(s)} className="text-xs text-muted hover:text-ink">Edit</button>
                      <button type="button" onClick={() => handleDelete(s.id)} disabled={busyId === s.id} className="text-xs text-muted hover:text-breach disabled:opacity-50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <Card>
              <p className="text-muted text-center py-4">No shifts match this filter.</p>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
