import Card from './Card.jsx';
import { formatDate, formatTime, getDayOfWeek } from '../lib/date.js';
import { formatCurrency } from '../lib/pay.js';

export default function ShiftCard({ shift }) {
  const day = getDayOfWeek(shift.shift_date);
  const isWeekend = day === 'saturday' || day === 'sunday';

  return (
    <Card className="mb-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(18,48,57,0.06),0_8px_20px_rgba(18,48,57,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-ink">{shift.employer}</p>
          <p className="text-sm text-muted">
            {formatDate(shift.shift_date)}
            {isWeekend && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-teal/10 text-teal">
                {day === 'saturday' ? 'Sat' : 'Sun'}
              </span>
            )}
          </p>
          <p className="text-sm text-muted mt-1">
            {formatTime(shift.start_time)} – {formatTime(shift.finish_time)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-money tabular-nums">{formatCurrency(shift.pay)}</p>
          <p className="text-sm text-muted tabular-nums">{shift.hours.toFixed(1)}h</p>
        </div>
      </div>
    </Card>
  );
}

