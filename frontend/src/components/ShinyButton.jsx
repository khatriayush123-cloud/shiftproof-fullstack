/**
 * ShinyButton — animated gradient CTA for the login screen.
 *
 * Uses ShiftProof design tokens (ink + teal). No blue, no red.
 * Styled via ShinyButton.css — no inline styles or styled-jsx.
 *
 * Used ONLY on the LoginScreen. All other buttons use AppButton.
 */

import './ShinyButton.css';

export default function ShinyButton({ children, type = 'button', onClick, disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="shiny-button"
    >
      {children}
    </button>
  );
}
