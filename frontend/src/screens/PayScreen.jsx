import { useState, useMemo } from 'react';
import { useShift, DEFAULT_PAY_SETTINGS } from '../context/ShiftContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AppShell from '../components/AppShell.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import AppButton from '../components/AppButton.jsx';
import FortnightMeter from '../components/FortnightMeter.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import BackLink from '../components/BackLink.jsx';
import { formatCurrency, pluralise } from '../lib/pay.js';
import { formatDateRange } from '../lib/date.js';

/* Real award rates vary by classification and by award, so a fixed rate
   would give some users a wrong figure. Letting them enter their actual
   rate from their own payslip makes the calculation correct for them
   rather than approximately right for everyone. */

const AWARD_OPTIONS = [
  { value: 'MA000003', label: 'Fast Food (MA000003)' },
  { value: 'MA000119', label: 'Restaurant (MA000119)' },
  { value: 'MA000009', label: 'Hospitality (MA000009)' },
];
const CLASS_OPTIONS = [
  { value: '1', label: 'Level 1' }, { value: '2', label: 'Level 2' },
  { value: '3', label: 'Level 3' }, { value: '4', label: 'Level 4' },
  { value: '5', label: 'Level 5' },
];

/** Fortnight cards come straight from the server's periods (hours, pay and
 *  shift_count per window). Shifts older than the six periods are summed
 *  for a single "Older" card. */
function buildGroups(shifts, summary) {
  const covered = summary.periods
    .filter((p) => p.shift_count > 0)
    .map((p) => ({
      key: `${p.window_start}/${p.window_end}`,
      label: formatDateRange(p.window_start, p.window_end),
      shift_count: p.shift_count,
      hours: p.hours,
      pay: p.pay,
    }));
  const olderShifts = shifts.filter(
    (s) => !summary.periods.some((p) => s.shift_date >= p.window_start && s.shift_date <= p.window_end),
  );
  const older = olderShifts.length > 0
    ? {
      key: 'older',
      label: 'Older',
      shift_count: olderShifts.length,
      hours: olderShifts.reduce((sum, s) => sum + s.hours, 0),
      pay: olderShifts.reduce((sum, s) => sum + s.pay, 0),
    }
    : null;
  return older ? [...covered, older] : covered;
}

export default function PayScreen() {
  const { shifts, summary, profile, savePaySettings, resetPaySettings, isLoading } = useShift();
  const { addToast } = useToast();
  const [editingPay, setEditingPay] = useState(false);
  const [payForm, setPayForm] = useState({ ...DEFAULT_PAY_SETTINGS });
  const [payErrors, setPayErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const groups = useMemo(
    () => (summary ? buildGroups(shifts, summary) : []),
    [shifts, summary],
  );
  const totalEarned = useMemo(() => shifts.reduce((s, sh) => s + sh.pay, 0), [shifts]);
  const totalHours = useMemo(() => shifts.reduce((s, sh) => s + sh.hours, 0), [shifts]);
  const avgRate = totalHours > 0 ? totalEarned / totalHours : 0;
  const rateDiff = profile ? avgRate - profile.base_rate : 0;

  function handlePayChange(e) {
    const { name, value } = e.target;
    setPayForm((p) => ({ ...p, [name]: value }));
    if (payErrors[name]) setPayErrors((p) => ({ ...p, [name]: '' }));
  }

  function validatePay() {
    const errs = {};
    const br = Number(payForm.base_rate), cl = Number(payForm.casual_loading);
    const sm = Number(payForm.saturday_multiplier), su = Number(payForm.sunday_multiplier);
    const ph = Number(payForm.public_holiday_multiplier);
    if (isNaN(br) || br < 1 || br > 200) errs.base_rate = 'Must be between $1 and $200';
    if (isNaN(cl) || cl < 0 || cl > 100) errs.casual_loading = 'Must be between 0% and 100%';
    if (isNaN(sm) || sm < 1 || sm > 5) errs.saturday_multiplier = 'Must be between 1 and 5';
    if (isNaN(su) || su < 1 || su > 5) errs.sunday_multiplier = 'Must be between 1 and 5';
    if (isNaN(ph) || ph < 1 || ph > 5) errs.public_holiday_multiplier = 'Must be between 1 and 5';
    return errs;
  }

  async function handleSavePay() {
    const errs = validatePay();
    if (Object.keys(errs).length > 0) { setPayErrors(errs); return; }
    setBusy(true);
    try {
      await savePaySettings({
        base_rate: Number(payForm.base_rate),
        casual_loading: Number(payForm.casual_loading),
        saturday_multiplier: Number(payForm.saturday_multiplier),
        sunday_multiplier: Number(payForm.sunday_multiplier),
        public_holiday_multiplier: Number(payForm.public_holiday_multiplier),
      });
      setEditingPay(false);
      addToast(`Pay settings updated — ${pluralise(shifts.length, 'shift')} recalculated`, 'success');
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPay() {
    setBusy(true);
    try {
      await resetPaySettings();
      setPayForm({ ...DEFAULT_PAY_SETTINGS });
      setEditingPay(false);
      addToast('Pay settings reset to 2026 defaults', 'success');
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <AppShell title="My pay">
        <BackLink />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </AppShell>
    );
  }

  return (
    <AppShell title="My pay">
      <BackLink />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="card-lift">
          <p className="text-sm text-muted mb-2">Total earned</p>
          <p className="text-3xl font-heading font-bold text-money tabular-nums">{formatCurrency(totalEarned)}</p>
        </Card>
        <Card className="card-lift">
          <p className="text-sm text-muted mb-2">Total hours</p>
          <p className="text-3xl font-heading font-bold text-ink tabular-nums">{totalHours.toFixed(1)}</p>
        </Card>
        <Card className="card-lift">
          <p className="text-sm text-muted mb-2">Avg hourly rate</p>
          <p className="text-3xl font-heading font-bold text-ink tabular-nums">{formatCurrency(avgRate)}</p>
          <p className="text-xs text-muted mt-1">{formatCurrency(avgRate)}/hr average — {rateDiff >= 0 ? formatCurrency(rateDiff) : '-' + formatCurrency(Math.abs(rateDiff))} {rateDiff >= 0 ? 'above' : 'below'} the {formatCurrency(profile.base_rate)} base rate, from casual loading and weekend penalties</p>
        </Card>
      </div>

      {/* Editable pay settings */}
      <PaySettingsCard editing={editingPay} setEditing={setEditingPay} payForm={payForm}
        setPayForm={setPayForm} payErrors={payErrors} onChange={handlePayChange}
        onSave={handleSavePay} onCancel={() => setEditingPay(false)} onReset={handleResetPay}
        profile={profile} busy={busy} />

      {/* Pay breakdown explanation */}
      <Card className="mb-6">
        <h3 className="font-semibold text-ink mb-3">How your pay is calculated</h3>
        <div className="text-sm text-muted space-y-2">
          <p><strong className="text-ink">Base rate:</strong> {formatCurrency(profile.base_rate)}/hr</p>
          <p><strong className="text-ink">Casual loading:</strong> +{profile.casual_loading}%</p>
          <p><strong className="text-ink">Saturday:</strong> ×{profile.saturday_multiplier}</p>
          <p><strong className="text-ink">Sunday:</strong> ×{profile.sunday_multiplier}</p>
          <p className="pt-2 text-xs">Adjust the settings above to match your own payslip.</p>
        </div>
      </Card>

      <h2 className="text-lg font-heading font-semibold text-ink mb-3">Fortnight history</h2>
      {groups.length === 0 ? (
        <Card><p className="text-muted text-center py-4">No shifts logged yet.</p></Card>
      ) : groups.map((g) => (
        <Card key={g.key} className="mb-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-medium text-ink">{g.label}</p>
              <p className="text-xs text-muted tabular-nums">{pluralise(g.shift_count, 'shift')}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-heading font-semibold text-money tabular-nums">{formatCurrency(g.pay)}</p>
              <p className="text-xs text-muted tabular-nums">{g.hours.toFixed(1)} hrs</p>
            </div>
          </div>
          <FortnightMeter hoursWorked={g.hours} size="compact" />
        </Card>
      ))}
    </AppShell>
  );
}


function PaySettingsCard({ editing, setEditing, payForm, setPayForm, payErrors, onChange, onSave, onCancel, onReset, profile, busy }) {
  if (!editing) {
    return (
      <Card className="mb-6">
        <h3 className="font-semibold text-ink mb-3">Pay settings</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          {profile.award && <><span className="text-muted">Award</span><span className="text-ink">{profile.award}</span></>}
          {profile.classification && <><span className="text-muted">Classification</span><span className="text-ink">Level {profile.classification}</span></>}
          <span className="text-muted">Base rate</span><span className="text-ink tabular-nums">{formatCurrency(profile.base_rate)}/hr</span>
          <span className="text-muted">Casual loading</span><span className="text-ink tabular-nums">{profile.casual_loading}%</span>
          <span className="text-muted">Saturday</span><span className="text-ink tabular-nums">×{profile.saturday_multiplier}</span>
          <span className="text-muted">Sunday</span><span className="text-ink tabular-nums">×{profile.sunday_multiplier}</span>
          <span className="text-muted">Public holiday</span><span className="text-ink tabular-nums">×{profile.public_holiday_multiplier}</span>
        </div>
        <AppButton variant="secondary" onClick={() => { setPayForm({
          base_rate: profile.base_rate,
          casual_loading: profile.casual_loading,
          saturday_multiplier: profile.saturday_multiplier,
          sunday_multiplier: profile.sunday_multiplier,
          public_holiday_multiplier: profile.public_holiday_multiplier,
        }); setEditing(true); }}>
          Edit pay settings
        </AppButton>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <h3 className="font-semibold text-ink mb-3">Edit pay settings</h3>
      <FormField label="Base hourly rate ($)" name="base_rate" type="number" value={String(payForm.base_rate)} onChange={onChange} placeholder="26.44" helper="From your payslip" error={payErrors.base_rate} />
      <FormField label="Casual loading (%)" name="casual_loading" type="number" value={String(payForm.casual_loading)} onChange={onChange} placeholder="25" error={payErrors.casual_loading} />
      <FormField label="Saturday multiplier" name="saturday_multiplier" type="number" value={String(payForm.saturday_multiplier)} onChange={onChange} placeholder="1.25" error={payErrors.saturday_multiplier} />
      <FormField label="Sunday multiplier" name="sunday_multiplier" type="number" value={String(payForm.sunday_multiplier)} onChange={onChange} placeholder="1.5" error={payErrors.sunday_multiplier} />
      <FormField label="Public holiday multiplier" name="public_holiday_multiplier" type="number" value={String(payForm.public_holiday_multiplier)} onChange={onChange} placeholder="2.25" error={payErrors.public_holiday_multiplier} />
      <div className="flex gap-3 mt-4">
        <AppButton variant="primary" onClick={onSave} disabled={busy}>Save</AppButton>
        <AppButton variant="secondary" onClick={onCancel} disabled={busy}>Cancel</AppButton>
      </div>
      <button type="button" onClick={onReset} disabled={busy} className="mt-3 text-sm text-muted hover:text-ink underline disabled:opacity-50">
        Reset to 2026 defaults
      </button>
    </Card>
  );
}
