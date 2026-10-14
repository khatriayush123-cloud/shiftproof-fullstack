import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShift } from '../context/ShiftContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AppShell from '../components/AppShell.jsx';
import FortnightMeter from '../components/FortnightMeter.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import AppButton from '../components/AppButton.jsx';
import BackLink from '../components/BackLink.jsx';

export default function CheckShiftScreen() {
  const { summary, checkShift } = useShift();
  const { addToast } = useToast();
  const navigate = useNavigate();
  // Prefilled via navigation state (e.g. "Shorten this shift" on the result
  // screen) so the user can adjust the finish time and check again.
  const { state: prefill } = useLocation();
  const [form, setForm] = useState(() => ({
    shift_date: prefill?.shift_date ?? '',
    employer: prefill?.employer ?? '',
    start_time: prefill?.start_time ?? '',
    finish_time: '',
    is_public_holiday: prefill?.is_public_holiday ?? false,
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

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
      const payload = {
        shift_date: form.shift_date,
        employer: form.employer.trim(),
        start_time: form.start_time,
        finish_time: form.finish_time,
        unpaid_break_minutes: 0,
        is_public_holiday: form.is_public_holiday,
      };
      const result = await checkShift(payload);
      navigate('/result', { state: { ...result, ...payload } });
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Check a shift">
      <div className="max-w-[520px] mx-auto">
        <BackLink />
        <p className="text-muted mb-4">See if a shift fits within your visa hours before you accept it.</p>
        <Card className="mb-6">
          <p className="text-sm text-muted mb-3">Current fortnight</p>
          <FortnightMeter hoursWorked={summary?.hours ?? 0} size="compact" />
        </Card>
        <form onSubmit={handleSubmit}>
          <FormField label="Date" name="shift_date" type="date" value={form.shift_date} onChange={handleChange} error={errors.shift_date} />
          <FormField label="Employer" name="employer" type="text" value={form.employer} onChange={handleChange} placeholder="e.g. Grill'd" error={errors.employer} />
          <FormField label="Start time" name="start_time" type="time" value={form.start_time} onChange={handleChange} error={errors.start_time} />
          <FormField label="Finish time" name="finish_time" type="time" value={form.finish_time} onChange={handleChange}
            helper="Finishing after midnight is fine — just pick the time" error={errors.finish_time} />
          <label className="flex items-start gap-2.5 mb-5 text-sm text-muted cursor-pointer">
            <input type="checkbox" name="is_public_holiday" checked={form.is_public_holiday}
              onChange={handleChange} className="mt-0.5 accent-teal" />
            <span>This was a public holiday</span>
          </label>
          <AppButton type="submit" disabled={busy}>Check this shift</AppButton>
        </form>
      </div>
    </AppShell>
  );
}
