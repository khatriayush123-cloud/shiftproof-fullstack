import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Search, Clock, Shield, DollarSign, BookOpen, LogOut } from 'lucide-react';
import { useShift } from '../context/ShiftContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Logo from './Logo.jsx';
import FortnightMeter from './FortnightMeter.jsx';
import { formatDateRange } from '../lib/date.js';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/add-shift', label: 'Add shift', icon: PlusCircle },
  { path: '/check-shift', label: 'Check a shift', icon: Search },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/pay', label: 'My pay', icon: DollarSign },
  { path: '/guide', label: 'Guide', icon: BookOpen },
  { path: '/privacy', label: 'Privacy', icon: Shield },
];

export default function AppShell({ children, title }) {
  const { summary, profile } = useShift();
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const dateRangeLabel = summary ? formatDateRange(summary.window_start, summary.window_end) : '';
  const fortnightHours = summary?.hours ?? 0;

  async function handleSignOut() {
    await signOut();
    addToast('Signed out', 'success');
    navigate('/auth');
  }

  /** NavLink className — uses isActive from render prop, never hardcoded. */
  function navClass({ isActive }) {
    return [
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
      'transition-colors duration-150',
      isActive
        ? 'border-l-[3px] border-teal text-teal bg-teal/5'
        : 'text-muted hover:text-ink hover:bg-ink/5',
    ].join(' ');
  }

  function mobileNavClass({ isActive }) {
    return [
      'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium',
      'transition-colors duration-150',
      isActive ? 'text-teal' : 'text-muted',
    ].join(' ');
  }

  function userInitials() {
    if (!user?.name) return '?';
    return user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      {/* ── Desktop sidebar: 1024px+ ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] bg-card border-r border-border flex-col z-40">
        <div className="px-7 pt-7 pb-4 flex items-center gap-2.5">
          <Logo size={24} className="text-teal" />
          <span className="font-heading font-bold text-xl text-teal">ShiftProof</span>
        </div>

        <div className="px-7 mb-6">
          <p className="text-xs text-muted mb-3 font-medium uppercase tracking-wider">This fortnight</p>
          <FortnightMeter hoursWorked={fortnightHours} size="compact" />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted tabular-nums">{fortnightHours.toFixed(1)} / 48 hrs</p>
            {summary && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                summary.in_session
                  ? 'bg-teal/12 text-teal'
                  : 'bg-muted/10 text-muted'
              }`}>
                {summary.in_session ? 'In session' : 'Semester break'}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end className={navClass}>
              <item.icon size={18} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User card + sign out */}
        <div className="px-5 py-4 border-t border-border">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-teal text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {userInitials()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}
          {profile && (
            <div className="mb-3">
              <p className="text-xs text-muted mb-0.5">Award</p>
              <p className="text-sm text-ink font-medium truncate">{profile.award}</p>
              <p className="text-xs text-muted mt-1.5 mb-0.5">Classification</p>
              <p className="text-sm text-ink font-medium">Level {profile.classification}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-sm font-medium text-muted hover:text-ink hover:bg-ink/5 transition-colors duration-150"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar: below 1024px ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 px-2 z-40">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} end className={mobileNavClass}>
            <item.icon size={20} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Main content area ── */}
      <div className="lg:ml-[260px] pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border h-[72px] flex items-center justify-between px-4 sm:px-6 lg:px-10">
          <h1 className="text-xl font-heading font-bold text-ink truncate">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted tabular-nums hidden sm:block">{dateRangeLabel}</span>
            {/* Mobile sign-out icon */}
            <button
              type="button"
              onClick={handleSignOut}
              className="lg:hidden p-2 rounded-lg text-muted hover:text-ink hover:bg-ink/5 transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

