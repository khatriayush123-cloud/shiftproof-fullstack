import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useShift } from '../context/ShiftContext.jsx';
import SkeletonCard from './SkeletonCard.jsx';

/**
 * Route guard that enforces authentication and setup completion.
 *
 * Waits for the session restore (GET /api/auth/me) and the first data load
 * before deciding anything, showing the skeleton meanwhile. Setup state
 * comes from profile.setup_complete on the server.
 *
 * Rules:
 *   /auth + not authenticated -> render the auth screen (no redirect)
 *   /auth or /setup + authenticated with setup complete -> /dashboard
 *   /setup + authenticated without setup -> render setup
 *   Any other route + not authenticated -> /auth
 *   Any other route + authenticated without setup -> /setup
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: dataLoading } = useShift();
  const location = useLocation();
  const path = location.pathname;

  if (authLoading || (isAuthenticated && dataLoading)) {
    return (
      <div className="min-h-screen bg-paper flex flex-col justify-center gap-4 max-w-[520px] mx-auto px-6 py-12">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const setupComplete = profile?.setup_complete === true;

  // On /auth and not authenticated -> show the auth screen
  if (path === '/auth' && !isAuthenticated) {
    return children;
  }

  // Authenticated with setup complete -> redirect away from auth/setup
  if (isAuthenticated && setupComplete && (path === '/auth' || path === '/setup')) {
    return <Navigate to="/dashboard" replace />;
  }

  // On /setup and authenticated without setup -> show setup
  if (path === '/setup' && isAuthenticated && !setupComplete) {
    return children;
  }

  // Not authenticated on a protected route -> redirect to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Authenticated without setup on a protected route -> redirect to setup
  if (!setupComplete) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}
