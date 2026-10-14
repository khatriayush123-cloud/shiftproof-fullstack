import { useNavigate } from 'react-router-dom';
import { useShift } from '../context/ShiftContext.jsx';
import AppShell from '../components/AppShell.jsx';
import Card from '../components/Card.jsx';
import FortnightMeter from '../components/FortnightMeter.jsx';
import AppButton from '../components/AppButton.jsx';
import ShiftCard from '../components/ShiftCard.jsx';
import CountAnimation from '../components/CountAnimation.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import { formatCurrency } from '../lib/pay.js';
import { formatDate, getDayOfWeek } from '../lib/date.js';

export default function DashboardScreen() {
  const { shifts, summary, isLoading } = useShift();
  const navigate = useNavigate();

  if (isLoading || !summary) {
    return (
      <AppShell title="Dashboard">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="card-lift">
          <p className="text-sm text-muted mb-2">Fortnight hours</p>
          <CountAnimation number={summary.hours} decimals={1}
            className="text-3xl font-heading font-bold text-ink tabular-nums" />
          <p className="text-xs text-muted mb-3 tabular-nums">of 48 hrs</p>
          <FortnightMeter hoursWorked={summary.hours} size="compact" />
        </Card>
        <Card className="card-lift">
          <p className="text-sm text-muted mb-2">Expected pay</p>
          <CountAnimation number={summary.expected_pay} decimals={2} formatter={formatCurrency}
            className="text-3xl font-heading font-bold text-money tabular-nums" />
          <p className="text-xs text-muted mt-1">this fortnight</p>
        </Card>
        <Card className="card-lift">
          <p className="text-sm text-muted mb-2">Shifts logged</p>
          <CountAnimation number={summary.shift_count} decimals={0}
            className="text-3xl font-heading font-bold text-ink tabular-nums" />
          <p className="text-xs text-muted mt-1">in current fortnight</p>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-heading font-semibold text-ink mb-3">Recent shifts</h2>
          {shifts.length === 0 ? (
            <Card>
              <p className="text-muted text-center py-2 mb-4">No shifts yet.</p>
              <AppButton onClick={() => navigate('/add-shift')}>Add your first shift</AppButton>
            </Card>
          ) : (
            <>
              <Card className="hidden lg:block overflow-hidden !p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-medium text-muted px-5 py-3">Date</th>
                      <th className="text-left font-medium text-muted px-5 py-3">Employer</th>
                      <th className="text-right font-medium text-muted px-5 py-3">Hours</th>
                      <th className="text-right font-medium text-muted px-5 py-3">Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift, i) => {
                      const day = getDayOfWeek(shift.shift_date);
                      const wk = day === 'saturday' || day === 'sunday';
                      return (
                        <tr key={shift.id} className={`row-highlight ${i % 2 === 0 ? 'bg-paper/50' : 'bg-card'}`}>
                          <td className="px-5 py-3 text-ink">{formatDate(shift.shift_date)}
                            {wk && <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-teal/10 text-teal">{day === 'saturday' ? 'Sat' : 'Sun'}</span>}
                          </td>
                          <td className="px-5 py-3 text-ink">{shift.employer}</td>
                          <td className="px-5 py-3 text-right tabular-nums">{shift.hours.toFixed(1)}</td>
                          <td className="px-5 py-3 text-right text-money font-medium tabular-nums">{formatCurrency(shift.pay)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
              <div className="lg:hidden">
                {shifts.map((s) => <ShiftCard key={s.id} shift={s} />)}
              </div>
            </>
          )}
        </div>

        <div className="lg:w-[340px] lg:flex-shrink-0">
          <h2 className="text-lg font-heading font-semibold text-ink mb-3">Quick actions</h2>
          <Card>
            <div className="flex flex-col gap-3">
              <AppButton variant="primary" onClick={() => navigate('/add-shift')}>Add shift</AppButton>
              <AppButton variant="secondary" onClick={() => navigate('/check-shift')}>Check a shift</AppButton>
            </div>
            <p className="text-xs text-muted mt-4 leading-relaxed">
              Check a shift to see if it fits within your 48-hour visa limit
              before you accept it. You will see the estimated pay and your
              projected fortnight total.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
