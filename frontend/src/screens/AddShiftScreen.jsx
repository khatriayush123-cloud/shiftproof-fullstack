import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShift } from '../context/ShiftContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AppShell from '../components/AppShell.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import AppButton from '../components/AppButton.jsx';
import PayBreakdown from '../components/PayBreakdown.jsx';
import BackLink from '../components/BackLink.jsx';
import { formatCurrency } from '../lib/pay.js';

const PREVIEW_DEBOUNCE_MS = 400;

const EMPTY_FORM = {
  shift_date: '', employer: '', start_time: '', finish_time: '',
  unpaid_break_minutes: '', is_public_holiday: false,
};

export default function AddShiftScreen() {
  const { addShift, checkShift } = useShift();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(null);
  const previewSeq = useRef(0);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  // Live pay preview: the server is the only calculator, so this dry-runs
  // POST /api/shifts/check (debounced) instead of computing anything here.
  // Overnight shifts are allowed (finish before start crosses midnight).
  useEffect(() => {
    if (!form.shift_date || !form.start_time || !form.finish_time) {
      setPreview(null);
      return undefined;
    }
    const seq = previewSeq.current + 1;
    previewSeq.current = seq;
    const timer = setTimeout(async () => {
      try {
        const result = await checkShift({
          shift_date: form.shift_date,
          start_time: form.start_time,
          finish_time: form.finish_time,
          unpaid_break_minutes: Number(form.unpaid_break_minutes) || 0,
          is_public_holiday: form.is_public_holiday,
        });
        if (seq === previewSeq.current) setPreview(result);
      } catch {
        if (seq === previewSeq.current) setPreview(null);
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [form.shift_date, form.start_time, form.finish_time, form.unpaid_break_minutes,
    form.is_public_holiday, checkShift]);

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.shift_date) newErrors.shift_date = 'Please enter the shift date';
    if (!form.employer.trim()) newErrors.employer = 'Please enter your employer';
    if (!form.start_time) newErrors.start_time = 'Please enter a start time';
    if (!form.finish_time) newErrors.finish_time = 'Please enter a finish time';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setBusy(true);
    try {
      await addShift({
        shift_date: form.shift_date,
        employer: form.employer.trim(),
        start_time: form.start_time,
        finish_time: form.finish_time,
        unpaid_break_minutes: Number(form.unpaid_break_minutes) || 0,
        is_public_holiday: form.is_public_holiday,
      });
      addToast('Shift saved', 'success');
      setSaved(true);
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  function handleAddAnother() {
    setForm(EMPTY_FORM);
    setErrors({});
    setPreview(null);
    setSaved(false);
  }

  // After a save we stay on this screen and make the next step explicit,
  // instead of sending the user back to the dashboard straight away.
  if (saved) {
    return (
      <AppShell title="Add a shift">
        <div className="max-w-[520px] mx-auto">
          <BackLink />
          <Card>
            <p className="text-lg font-heading font-semibold text-ink mb-1">Shift saved</p>
            <p className="text-muted text-sm mb-5">What would you like to do next?</p>
            <div className="flex flex-col gap-3">
              <AppButton onClick={handleAddAnother}>Add another</AppButton>
              <AppButton variant="secondary" onClick={() => navigate('/dashboard')}>Back to dashboard</AppButton>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Add a shift">
      <div className="max-w-[520px] mx-auto">
        <BackLink />
        <p className="text-muted mb-6">Log a shift you've already worked.</p>
        <form onSubmit={handleSubmit}>
          <FormField label="Date" name="shift_date" type="date" value={form.shift_date} onChange={handleChange} error={errors.shift_date} />
          <FormField label="Employer" name="employer" type="text" value={form.employer} onChange={handleChange} placeholder="e.g. Grill'd" error={errors.employer} />
          <FormField label="Start time" name="start_time" type="time" value={form.start_time} onChange={handleChange} error={errors.start_time} />
          <FormField label="Finish time" name="finish_time" type="time" value={form.finish_time} onChange={handleChange}
            helper="Finishing after midnight is fine — just pick the time" error={errors.finish_time} />
          <FormField label="Unpaid break (minutes)" name="unpaid_break_minutes" type="number" value={form.unpaid_break_minutes} onChange={handleChange} placeholder="0" helper="Leave blank if no break" />
          <label className="flex items-start gap-2.5 mb-5 text-sm text-muted cursor-pointer">
            <input type="checkbox" name="is_public_holiday" checked={form.is_public_holiday}
              onChange={handleChange} className="mt-0.5 accent-teal" />
            <span>This was a public holiday</span>
          </label>

          {/* Live pay preview */}
          {preview && (
            <Card className="mb-4 bg-paper">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted mb-0.5">Estimated pay</p>
                  <p className="text-lg font-heading font-semibold text-money tabular-nums">{formatCurrency(preview.pay)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted mb-0.5">Hours</p>
                  <p className="text-lg font-heading font-semibold text-ink tabular-nums">{preview.hours.toFixed(1)}</p>
                </div>
              </div>
              <PayBreakdown breakdown={preview.breakdown} pay={preview.pay} hours={preview.hours} />
            </Card>
          )}

          <AppButton type="submit" disabled={busy}>Save shift</AppButton>
        </form>
      </div>
    </AppShell>
  );
}
