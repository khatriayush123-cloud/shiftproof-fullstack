import { useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'framer-motion';

/**
 * CountAnimation — animates a number from 0 to the target value.
 *
 * Props:
 *   number   — target value to animate to
 *   decimals — decimal places to display (default 1)
 *   className — CSS class string
 *   duration — animation duration in seconds (default 1.2)
 *
 * Respects prefers-reduced-motion: renders the final value immediately
 * with no animation when the user has requested reduced motion.
 */
export default function CountAnimation({
  number,
  decimals = 1,
  className = '',
  duration = 1.2,
  formatter = null,
}) {
  const motionValue = useMotionValue(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  function formatValue(v) {
    return formatter ? formatter(v) : v.toFixed(decimals);
  }

  // Subscribe to motion value changes and update the DOM directly
  // to avoid unnecessary React re-renders on every animation frame.
  useEffect(() => {
    const unsubscribe = motionValue.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = formatValue(v);
      }
    });
    return unsubscribe;
  }, [motionValue, decimals, formatter]);

  // Re-animate whenever `number` changes (fix: original had empty deps array)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      motionValue.set(number);
      if (ref.current) {
        ref.current.textContent = formatValue(number);
      }
      return;
    }

    // On first mount, animate from 0. On subsequent changes, animate
    // from the current value to the new target.
    const from = hasAnimated.current ? motionValue.get() : 0;
    motionValue.set(from);
    hasAnimated.current = true;

    const controls = animate(motionValue, number, {
      duration,
      ease: 'easeOut',
    });

    return () => controls.stop();
  }, [number, decimals, duration, motionValue]);

  return (
    <span ref={ref} className={className}>
      {formatValue(number)}
    </span>
  );
}
