/**
 * StatusBanner — displays success, caution, or breach states.
 * Each status maps to exactly one colour:
 *   success → teal, caution → caution, breach → breach.
 */

const statusStyles = {
  success: 'bg-teal/10 border-teal text-teal',
  caution: 'bg-caution/10 border-caution text-caution',
  breach: 'bg-breach/10 border-breach text-breach',
};

export default function StatusBanner({ status, message }) {
  return (
    <div className={`rounded-lg border-2 p-4 ${statusStyles[status]}`}>
      <p className="font-medium">{message}</p>
    </div>
  );
}
