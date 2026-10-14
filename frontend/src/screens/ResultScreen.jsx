import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShift } from '../context/ShiftContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AppShell from '../components/AppShell.jsx';
import Card from '../components/Card.jsx';
import FortnightMeter from '../components/FortnightMeter.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import AppButton from '../components/AppButton.jsx';
import CountAnimation from '../components/CountAnimation.jsx';
import BackLink from '../components/BackLink.jsx';
import PayBreakdown from '../components/PayBreakdown.jsx';
import { formatCurrency } from '../lib/pay.js';

const BANNERS = {
  over: { status: 'breach', message: null }, // message built from over_by below
  caution: { status: 'caution', message: 'Getting close to your 48-hour limit' },
  clear: { status: 'success', message: 'This shift fits within your visa hours' },
  unlimited: { status: 'success', message: 'Semester break — no hour limit applies right now' },
};

export default function ResultScreen() {
  const { state } = useLocation();
  const { addShift } = useShift();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!state) {
    return (
      <AppShell title="Shift result">
        <div className="max-w-[520px] mx-auto">
          <BackLink />
          <Card><p className="text-muted text-center py-4">No shift to check. Go back and try again.</p></Card>
          <div className="mt-4"><AppButton onClick={() => navigate('/check-shift')}>Check a shift</AppButton></div>
        </div>
      </AppShell>
    );
  }

  const {
    shift_date: shiftDate, employer, start_time: startTime, finish_time: finishTime,
    unpaid_break_minutes: unpaidBreak, is_public_holiday: isPublicHoliday,
    hours, pay, breakdown, cap, projected_hours: projectedHours, over_by: overBy, status,
  } = state;

  async function handleLog() {
    setBusy(true);
    try {
      await addShift({
        shift_date: shiftDate,
        employer,
        start_time: startTime,
        finish_time: finishTime,
        unpaid_break_minutes: unpaidBreak || 0,
        is_public_holiday: isPublicHoliday || false,
      });
      addToast('Shift saved', 'success');
      setSaved(true);
    } catch (err) {
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  // "Shorten this shift" never saves anything — it sends the user back to the
  // checker with date, employer, start time and public-holiday prefilled so
  // they can adjust the finish time and run the check again.
  function handleShorten() {
    navigate('/check-shift', {
      state: {
        shift_date: shiftDate,
        employer,
        start_time: startTime,
        is_public_holiday: isPublicHoliday || false,
      },
    });
  }

  // After a save we stay on this screen and make the next step explicit,
  // instead of sending the user back to the dashboard straight away.
  if (saved) {
    return (
      <AppShell title="Shift result">
        <div className="max-w-[520px] mx-auto">
          <BackLink />
          <Card>
            <p className="text-lg font-heading font-semibold text-ink mb-1">Shift saved</p>
            <p className="text-muted text-sm mb-5">What would you like to do next?</p>
            <div className="flex flex-col gap-3">
              <AppButton onClick={() => navigate('/add-shift')}>Add another</AppButton>
              <AppButton variant="secondary" onClick={() => navigate('/dashboard')}>Back to dashboard</AppButton>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  const banner = BANNERS[status] ?? BANNERS.clear;
  const bannerMessage = status === 'over'
    ? `Over the ${cap}-hour limit by ${overBy.toFixed(1)} hours`
    : banner.message;

  return (
    <AppShell title="Shift result">
      <div className="max-w-[520px] mx-auto">
        <BackLink />
        {status === 'over' ? (
          <>
            <StatusBanner status="breach" message={bannerMessage} />
            <Card className="mt-4 mb-4">
              <p className="text-sm text-muted mb-3">If you log this shift</p>
              <FortnightMeter hoursWorked={projectedHours} capHours={cap} size="large" />
            </Card>
            <Card className="mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted">Shift pay</p>
                  <p className="text-xl font-heading font-semibold text-money tabular-nums">{formatCurrency(pay)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Hours</p>
                  <p className="text-xl font-heading font-semibold text-ink tabular-nums">{hours.toFixed(1)}h</p>
                </div>
              </div>
              <PayBreakdown breakdown={breakdown} pay={pay} hours={hours} />
            </Card>
            <p className="text-muted text-sm mb-6">Logging this shift may put you over your Student visa (subclass 500) work limit. This is your decision — we show the numbers so you can choose.</p>
            <div className="flex flex-col gap-3">
              <AppButton variant="secondary" onClick={handleShorten}>Shorten this shift</AppButton>
              <AppButton variant="danger" onClick={handleLog} disabled={busy}>Log it anyway</AppButton>
            </div>
          </>
        ) : (
          <>
            <StatusBanner status={banner.status} message={bannerMessage} />
            <Card className="mt-4 mb-4">
              <p className="text-sm text-muted mb-3">After this shift</p>
              <FortnightMeter hoursWorked={projectedHours} capHours={cap} size="large" />
            </Card>
            <Card className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted">Estimated pay</p>
                  <p className="text-xl font-heading font-semibold text-money tabular-nums">{formatCurrency(pay)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Hours</p>
                  <CountAnimation number={hours} decimals={1} className="text-xl font-heading font-semibold text-ink tabular-nums" duration={0.8} />
                </div>
              </div>
              <PayBreakdown breakdown={breakdown} pay={pay} hours={hours} />
            </Card>
            <p className="text-muted text-sm mb-6">
              {status === 'unlimited'
                ? "You're on a semester break, so this shift doesn't count toward the 48-hour cap."
                : `You'll have ${(cap - projectedHours).toFixed(1)} hours remaining in your fortnight after this shift.`}
            </p>
            <div className="flex flex-col gap-3">
              <AppButton onClick={handleLog} disabled={busy}>Log this shift</AppButton>
              <AppButton variant="secondary" onClick={() => navigate('/check-shift')}>Check another</AppButton>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
