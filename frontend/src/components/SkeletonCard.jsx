/**
 * SkeletonCard — subtle loading placeholder.
 * Shows a pulsing card outline while context initialises.
 */
export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-[16px] bg-card border border-border p-5 animate-skeleton ${className}`}>
      <div className="h-3 w-24 bg-border rounded mb-3" />
      <div className="h-7 w-20 bg-border rounded mb-2" />
      <div className="h-2 w-full bg-border rounded" />
    </div>
  );
}
