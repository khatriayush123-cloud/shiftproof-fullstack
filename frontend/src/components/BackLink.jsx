/**
 * BackLink — "Back" text link with a left-arrow icon.
 * Returns to the previous screen via history; when this screen was the app's
 * entry point (no in-app history), falls back to the dashboard so the link
 * never dead-ends.
 */
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BackLink({ label = 'Back', fallback = '/dashboard' }) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleBack() {
    // location.key === 'default' means there is no in-app history to return to.
    if (location.key === 'default') {
      navigate(fallback);
    } else {
      navigate(-1);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 mb-4 text-sm font-medium text-muted hover:text-ink transition-colors duration-150 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
    >
      <ArrowLeft size={16} strokeWidth={1.8} />
      {label}
    </button>
  );
}
