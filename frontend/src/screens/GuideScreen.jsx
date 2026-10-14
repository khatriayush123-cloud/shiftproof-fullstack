import { BookOpen, Clock, DollarSign, AlertTriangle, HelpCircle } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import Card from '../components/Card.jsx';

export default function GuideScreen() {
  return (
    <AppShell title="Guide">
      <div className="max-w-[700px] mx-auto space-y-6">
        <Card>
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-2">The 48-hour rule</h3>
              <p className="text-sm text-muted leading-relaxed">
                If you hold a Student visa (subclass 500), you can work a maximum of
                <strong className="text-ink"> 48 hours per fortnight</strong> while your
                course is in session. A fortnight is any rolling 14-day window — it does
                not have to match your pay cycle.
              </p>
              <p className="text-sm text-muted leading-relaxed mt-2">
                During scheduled semester breaks, there is no limit on how many hours you
                can work.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <BookOpen size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-2">How the rolling fortnight works</h3>
              <p className="text-sm text-muted leading-relaxed">
                The 48-hour limit is measured across any 14-day window, not a calendar
                fortnight or a pay period. This means the window moves every day.
                If you worked 30 hours last week and 20 hours this week, you have
                exceeded the limit — even though each individual week was under 48.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <DollarSign size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-2">Casual loading and penalty rates</h3>
              <p className="text-sm text-muted leading-relaxed">
                <strong className="text-ink">Casual loading</strong> is an extra 25% on top
                of your base pay rate. It compensates for not getting paid leave, sick
                leave, or job security. If the base rate is $26.44/hr, casual loading
                makes it $33.05/hr.
              </p>
              <p className="text-sm text-muted leading-relaxed mt-2">
                <strong className="text-ink">Penalty rates</strong> are extra multipliers
                for working at certain times:
              </p>
              <ul className="text-sm text-muted mt-2 space-y-1 list-disc list-inside">
                <li><strong className="text-ink">Saturday:</strong> ×1.25 (your rate becomes $41.31/hr)</li>
                <li><strong className="text-ink">Sunday:</strong> ×1.5 (your rate becomes $49.58/hr)</li>
                <li><strong className="text-ink">Public holidays:</strong> often ×2.0 or more (check your award)</li>
                <li><strong className="text-ink">Evening/night:</strong> some awards add extra for late shifts</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-caution mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-2">What to do if your payslip looks wrong</h3>
              <ol className="text-sm text-muted leading-relaxed space-y-2 list-decimal list-inside">
                <li>Check your payslip against your award. The Fair Work Ombudsman
                  website has pay guides for every award.</li>
                <li>Compare the hours, base rate, and penalty rates on your payslip
                  with what this app calculates.</li>
                <li>If there is a difference, talk to your employer first. Show them
                  the award rate and ask them to explain.</li>
                <li>If they do not fix it, contact the Fair Work Ombudsman
                  (fairwork.gov.au) — they can help for free.</li>
                <li>Keep your own records. This app stores your shifts in your
                  ShiftProof account so you always have a record.</li>
              </ol>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <HelpCircle size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-ink mb-2">Important note</h3>
              <p className="text-sm text-muted leading-relaxed">
                ShiftProof is a planning tool, not legal advice. Award rates change,
                and your specific award may have rules this app does not cover
                (overtime, public holidays, split shifts). Always check your payslip
                against your own award, and contact Fair Work if you are unsure.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
