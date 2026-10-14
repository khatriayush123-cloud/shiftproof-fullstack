import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../lib/pay.js';

const MULTIPLIER_LABELS = {
  saturday: 'Saturday penalty',
  sunday: 'Sunday penalty',
  'public holiday': 'Public holiday penalty',
  weekday: 'Weekday rate',
};

/**
 * PayBreakdown — expandable pay transparency component.
 * Shows the full working behind every pay figure. The numbers come from the
 * server's breakdown object (the single source of truth) — nothing about pay
 * is recalculated in the browser.
 */
export default function PayBreakdown({ breakdown, hours, pay }) {
  const [open, setOpen] = useState(false);
  const multiplierName = MULTIPLIER_LABELS[breakdown.multiplier_label] ?? breakdown.multiplier_label;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        How this was calculated
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-lg bg-paper border border-border text-xs tabular-nums">
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted">Base rate</span><span>{formatCurrency(breakdown.base_rate)}/hr</span></div>
            <div className="flex justify-between"><span className="text-muted">Casual loading</span><span>+{breakdown.casual_loading}% → {formatCurrency(breakdown.loaded_rate)}/hr</span></div>
            {breakdown.multiplier > 1 && (
              <div className="flex justify-between"><span className="text-muted">{multiplierName}</span><span>×{breakdown.multiplier} → {formatCurrency(breakdown.hourly_rate)}/hr</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted">Hours worked</span><span>{hours.toFixed(1)}</span></div>
            <div className="border-t border-border pt-1.5 flex justify-between font-semibold text-ink">
              <span>Estimated pay</span>
              <span className="text-money">{formatCurrency(pay)}</span>
            </div>
          </div>
          <p className="mt-2 text-muted leading-relaxed">
            Calculated by ShiftProof from your pay settings. Check your payslip against your own award.
          </p>
        </div>
      )}
    </div>
  );
}
