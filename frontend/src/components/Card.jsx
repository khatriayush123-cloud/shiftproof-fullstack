/**
 * Card — surface container with border, radius, and soft shadow.
 * Uses design tokens: bg-card, border-border.
 */
export default function Card({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded-[16px] bg-card border border-border p-5',
        'shadow-[0_1px_3px_rgba(18,48,57,0.04),0_8px_24px_rgba(18,48,57,0.05)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

