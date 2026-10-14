/**
 * Logo — inline SVG shield with checkmark.
 * The shield reads as protection and the check as verification,
 * matching what ShiftProof does.
 * Props: size (default 24), className (colour inherited via currentColor).
 */
export default function Logo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="ShiftProof logo"
    >
      {/* Shield outline */}
      <path d="M12 2L3 6v5c0 5.25 3.75 10.15 9 11 5.25-.85 9-5.75 9-11V6l-9-4z" />
      {/* Checkmark */}
      <polyline points="8.5 12.5 11 15 16 9" />
    </svg>
  );
}
