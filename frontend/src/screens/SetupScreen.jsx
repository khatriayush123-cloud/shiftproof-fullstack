import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { useShift } from '../context/ShiftContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Logo from '../components/Logo.jsx';
import FormField from '../components/FormField.jsx';
import AppButton from '../components/AppButton.jsx';

const AWARD_OPTIONS = [
  { value: 'MA000003', label: 'Fast Food (MA000003)' },
  { value: 'MA000119', label: 'Restaurant (MA000119)' },
  { value: 'MA000009', label: 'Hospitality (MA000009)' },
];
const CLASSIFICATION_OPTIONS = [
  { value: '1', label: 'Level 1' }, { value: '2', label: 'Level 2' },
  { value: '3', label: 'Level 3' }, { value: '4', label: 'Level 4' },
  { value: '5', label: 'Level 5' },
];
const VISA_OPTIONS = [
  { value: 'student_500', label: 'Student subclass 500' },
  { value: 'other', label: 'Other' },
];

export default function SetupScreen() {
  const { saveSetup } = useShift();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ award: '', classification: '', visaType: '', semesterStart: '', semesterEnd: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.award) newErrors.award = 'Please select an award';
    if (!form.classification) newErrors.classification = 'Please select a level';
    if (!form.visaType) newErrors.visaType = 'Please select your visa type';
    if (Boolean(form.semesterStart) !== Boolean(form.semesterEnd)) {
      newErrors.semesterEnd = 'Enter both semester dates, or leave both blank';
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setBusy(true);
    try {
      await saveSetup({
        award: form.award,
        classification: Number(form.classification),
        visa_type: form.visaType,
        semester_start: form.semesterStart || null,
        semester_end: form.semesterEnd || null,
      });
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex font-body text-ink">
      {/* ── Left panel: ink background, visible 1024px+ ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-ink flex-col justify-between px-12 xl:px-16 py-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Logo size={32} className="text-teal" />
            <span className="font-heading font-bold text-3xl text-white">ShiftProof</span>
          </div>
          <p className="text-[#7FC4CE] text-lg leading-relaxed">
            Know what you're owed.<br />Know you're still legal.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm leading-relaxed">Track your 48-hour fortnight across every employer</p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm leading-relaxed">Check what a shift pays before you accept it</p>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm leading-relaxed">Know if a shift will breach your visa</p>
          </div>
        </div>
        <p className="text-white/30 text-xs">Built for casual hospitality workers on student visas.</p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 bg-paper flex flex-col items-center justify-center px-6 py-12">
        <div className="lg:hidden text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Logo size={28} className="text-teal" />
            <h1 className="font-heading font-bold text-2xl text-teal">ShiftProof</h1>
          </div>
          <p className="text-muted text-sm">Know what you're owed. Know you're still legal.</p>
        </div>

        <div className="w-full max-w-[420px]">
          <h2 className="text-xl font-heading font-bold text-ink mb-1">Set up your profile</h2>
          <p className="text-muted text-sm mb-6">We need a few details to check your pay and hours.</p>

          <form onSubmit={handleSubmit}>
            <FormField label="Your award" name="award" value={form.award} onChange={handleChange}
              helper="The award that covers your job" error={errors.award} options={AWARD_OPTIONS} />
            <FormField label="Classification level" name="classification" value={form.classification} onChange={handleChange}
              helper="Your pay level at work" error={errors.classification} options={CLASSIFICATION_OPTIONS} />
            <FormField label="Visa type" name="visaType" value={form.visaType} onChange={handleChange}
              helper="We check your hours against this limit" error={errors.visaType} options={VISA_OPTIONS} />
            <FormField label="Semester start date" name="semesterStart" type="date" value={form.semesterStart} onChange={handleChange}
              helper="When your current semester started (optional)" />
            <FormField label="Semester end date" name="semesterEnd" type="date" value={form.semesterEnd} onChange={handleChange}
              helper="When your current semester ends (optional)" error={errors.semesterEnd} />
            <AppButton type="submit" disabled={busy}>Save and go to dashboard</AppButton>
          </form>
        </div>
      </div>
    </div>
  );
}

