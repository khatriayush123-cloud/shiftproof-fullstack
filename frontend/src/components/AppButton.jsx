/**
 * AppButton — unified button component.
 * variant: "primary" (teal bg), "secondary" (teal outline), "danger" (breach bg).
 *
 * Interaction states: hover darkens 8%, active scales to 0.98,
 * visible focus ring in teal, 150ms transitions.
 * Respects prefers-reduced-motion.
 */

const variantStyles = {
  primary: [
    'bg-teal text-white',
    'hover:brightness-90',
    'active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
  ].join(' '),
  secondary: [
    'bg-card text-teal border border-teal',
    'hover:bg-teal/5',
    'active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
  ].join(' '),
  danger: [
    'bg-breach text-white',
    'hover:brightness-90',
    'active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-breach focus-visible:ring-offset-2',
  ].join(' '),
};

export default function AppButton({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  fullWidth = true,
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center',
        'rounded-lg px-6 py-3.5',
        'text-base font-semibold',
        'min-h-[48px]',
        'transition-all duration-150',
        'focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        variantStyles[variant],
        fullWidth ? 'w-full' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

