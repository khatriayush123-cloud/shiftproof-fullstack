import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Server, AlertTriangle, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AppShell from '../components/AppShell.jsx';
import Card from '../components/Card.jsx';
import AppButton from '../components/AppButton.jsx';

export default function PrivacyScreen() {
  const { deleteAccount } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleDeleteAll() {
    if (!window.confirm('This will permanently delete your account and every shift. Continue?')) return;
    setBusy(true);
    try {
      await deleteAccount();
      addToast('Account deleted', 'success');
      navigate('/auth');
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Privacy & Data">
      <div className="max-w-[640px] mx-auto space-y-6">
        <Card>
          <div className="flex items-start gap-3 mb-2">
            <Eye size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-1">What we collect</h3>
              <ul className="text-sm text-muted space-y-1.5 list-none">
                <li><strong className="text-ink">Award name</strong> — to calculate the correct pay rate</li>
                <li><strong className="text-ink">Classification level</strong> — to determine your base rate</li>
                <li><strong className="text-ink">Visa type</strong> — to apply the right fortnight hour limit</li>
                <li><strong className="text-ink">Shift times and dates</strong> — to calculate hours and penalty rates</li>
                <li><strong className="text-ink">Employer names</strong> — to show you per-employer summaries</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-2">
            <Shield size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-1">What we never collect</h3>
              <ul className="text-sm text-muted space-y-1.5 list-none">
                <li>Passport number</li>
                <li>Visa grant number</li>
                <li>Employer contact details</li>
                <li>Location data</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-2">
            <Server size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-1">Where it lives</h3>
              <p className="text-sm text-muted leading-relaxed">
                In a Supabase database in Sydney, Australia, tied to your
                account. Your session is kept in cookies that JavaScript cannot
                read, so your data follows your account, not this device.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-2">
            <Users size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-1">Who can read it</h3>
              <p className="text-sm text-muted leading-relaxed">
                Only your account. Database row-level security blocks every
                other user, and the app never sends data to employers or
                government.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-2">
            <AlertTriangle size={20} className="text-caution mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-1">Why it matters</h3>
              <p className="text-sm text-muted leading-relaxed">
                This record could show that you exceeded your visa work hours.
                That is exactly why ShiftProof keeps it locked to your account
                and never sends it anywhere. Your data is your business.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-caution/30">
          <h3 className="font-semibold text-ink mb-2 flex items-center gap-2">
            <Trash2 size={18} className="text-breach" />
            Delete my account
          </h3>
          <p className="text-sm text-muted mb-4">
            This permanently removes your account and every shift.
            This cannot be undone.
          </p>
          <AppButton variant="danger" onClick={handleDeleteAll} disabled={busy}>
            Delete my account
          </AppButton>
        </Card>
      </div>
    </AppShell>
  );
}
