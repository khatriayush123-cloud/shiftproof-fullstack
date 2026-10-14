/**
 * FortnightMeter — visualises hours worked against the 48-hour visa cap.
 *
 * The track spans 0–60 hours (capHours * 1.25) so the 48h marker sits at
 * 80% with visible headroom beyond it. When hours exceed capHours the fill
 * continues past the marker in breach colour, making the overage visually
 * obvious.
 *
 * A normal progress bar implies filling it is the goal.
 * Here, filling the bar means breaching a visa condition,
 * so the vertical marker reframes the bar as a ceiling, not a target.
 */

import CountAnimation from './CountAnimation.jsx';

const TRACK_MAX_MULTIPLIER = 1.25;
const TICK_HOURS = [12, 24, 36];

export default function FortnightMeter({ hoursWorked, capHours = 48, size = 'large' }) {
  const trackMax = capHours * TRACK_MAX_MULTIPLIER; // 60
  const markerPercent = (capHours / trackMax) * 100; // 80%
  const fillPercent = Math.min((hoursWorked / trackMax) * 100, 100);
  const isOver = hoursWorked > capHours;

  // Colour logic: teal (safe), caution (approaching), breach (over)
  let barColor = 'bg-teal';
  if (isOver) {
    barColor = 'bg-breach';
  } else if (hoursWorked / capHours > 0.75) {
    barColor = 'bg-caution';
  }

  return (
    <div className="w-full">
      {size === 'large' && (
        <div className="flex justify-between items-baseline mb-2">
          <CountAnimation
            number={hoursWorked}
            decimals={1}
            className="text-2xl font-heading font-semibold text-ink tabular-nums"
          />
          <span className="text-sm text-muted tabular-nums">
            / {capHours} hrs
          </span>
        </div>
      )}

      {/* Bottom padding reserves space for the limit label (large only) */}
      <div className={size === 'large' ? 'relative pb-7' : 'relative'}>
        <div className="relative h-2.5 bg-border rounded-full">
          {TICK_HOURS.map((h) => (
            <div key={h} className="absolute top-0 bottom-0 w-px bg-border"
              style={{ left: `${(h / trackMax) * 100}%` }} />
          ))}

          <div
            className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
            style={{ width: `${fillPercent}%`, transition: 'width 500ms ease-out' }}
          />

          <div className="absolute w-[2px] bg-ink rounded-full"
            style={{ left: `${markerPercent}%`, top: '-6px', bottom: '-6px' }} />
        </div>

        {/* "48h limit" label — large mode only, avoids collision with status pill in sidebar */}
        {size === 'large' && (
          <span className="absolute top-full mt-1 text-xs text-muted font-medium -translate-x-1/2"
            style={{ left: `${markerPercent}%` }}>
            {capHours}h limit
          </span>
        )}
      </div>
    </div>
  );
}

