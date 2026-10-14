import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Logo from '../components/Logo.jsx';
import FormField from '../components/FormField.jsx';
import ShinyButton from '../components/ShinyButton.jsx';

export default function AuthScreen() {
  const [tab, setTab] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const { signIn, signUp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  function clearForm() {
    setName(''); setEmail(''); setPassword(''); setConfirm('');
    setConsent(false); setErrors({});
  }
  function switchTab(next) { setTab(next); clearForm(); }

  async function handleSignIn(e) {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = 'Please enter your email';
    if (!password.trim()) errs.password = 'Please enter your password';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setBusy(true);
    try {
      const data = await signIn(email.trim(), password);
      navigate(data.profile?.setup_complete ? '/dashboard' : '/setup');
    } catch (err) {
      setErrors({ password: err.message });
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your name';
    if (!email.trim()) errs.email = 'Please enter your email';
    if (!password.trim()) errs.password = 'Please choose a password';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    if (!consent) errs.consent = 'Please tick the box to continue';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setBusy(true);
    try {
      const data = await signUp(name.trim(), email.trim(), password, consent);
      if (data.profile) {
        navigate('/setup');
      } else {
        addToast(data.message || 'Account created. Check your email to confirm.', 'success');
        switchTab('signin');
      }
    } catch (err) {
      setErrors({ email: err.message });
      addToast(err.message, 'warning');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex font-body text-ink">
      <div className="hidden lg:flex lg:w-[45%] bg-ink flex-col justify-between px-12 xl:px-16 py-12 relative overflow-hidden">
        {/* Slow conic gradient background at 8% opacity */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-conic-spin w-[200%] h-[200%]"
            style={{ background: 'conic-gradient(from 0deg, rgba(14,107,123,0.08), rgba(127,196,206,0.08), rgba(14,107,123,0.08))' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Logo size={32} className="text-teal" />
            <span className="font-heading font-bold text-3xl text-white">ShiftProof</span>
          </div>
          <p className="text-[#7FC4CE] text-lg leading-relaxed">Know what you're owed.<br />Know you're still legal.</p>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm leading-relaxed">Track your 48-hour fortnight across every employer</p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm leading-relaxed">Check what a shift pays before you accept it</p>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-teal mt-0.5 flex-shrink-0" />
            <p className="text-white/80 text-sm leading-relaxed">Know if a shift will breach your visa</p>
          </div>
        </div>
        <p className="relative z-10 text-white/30 text-xs">Built for casual hospitality workers on student visas.</p>
      </div>

      <div className="flex-1 bg-paper flex flex-col items-center justify-center px-6 py-12">
        <div className="lg:hidden text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Logo size={28} className="text-teal" />
            <h1 className="font-heading font-bold text-2xl text-teal">ShiftProof</h1>
          </div>
          <p className="text-muted text-sm">Know what you're owed. Know you're still legal.</p>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="flex bg-border/50 rounded-lg p-1 mb-6">
            <button type="button" onClick={() => switchTab('signin')}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${tab === 'signin' ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
              Sign in
            </button>
            <button type="button" onClick={() => switchTab('signup')}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${tab === 'signup' ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
              Create account
            </button>
          </div>

          {tab === 'signin' ? (
            <SignInForm email={email} setEmail={setEmail} password={password} setPassword={setPassword}
              errors={errors} onSubmit={handleSignIn} onSwitch={() => switchTab('signup')} busy={busy} />
          ) : (
            <SignUpForm name={name} setName={setName} email={email} setEmail={setEmail}
              password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm}
              consent={consent} setConsent={setConsent}
              errors={errors} onSubmit={handleSignUp} onSwitch={() => switchTab('signin')} busy={busy} />
          )}
        </div>
      </div>
    </div>
  );
}

function SignInForm({ email, setEmail, password, setPassword, errors, onSubmit, onSwitch, busy }) {
  return (
    <>
      <h2 className="text-xl font-heading font-bold text-ink mb-1">Welcome back</h2>
      <p className="text-muted text-sm mb-6">Sign in to check your shifts and hours.</p>
      <form onSubmit={onSubmit}>
        <FormField label="Email" name="email" type="text" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
          error={errors.email} />
        <FormField label="Password" name="password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
          error={errors.password} />
        <ShinyButton type="submit" disabled={busy}>Sign in</ShinyButton>
      </form>
      <p className="text-sm text-muted text-center mt-5">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-teal font-medium hover:underline">Create one</button>
      </p>
    </>
  );
}

function SignUpForm({ name, setName, email, setEmail, password, setPassword, confirm, setConfirm, consent, setConsent, errors, onSubmit, onSwitch, busy }) {
  return (
    <>
      <h2 className="text-xl font-heading font-bold text-ink mb-1">Create your account</h2>
      <p className="text-muted text-sm mb-6">Set up in under a minute.</p>
      <form onSubmit={onSubmit}>
        <FormField label="Full name" name="name" type="text" value={name}
          onChange={(e) => setName(e.target.value)} placeholder="Your name" error={errors.name} />
        <FormField label="Email" name="email" type="text" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" error={errors.email} />
        <FormField label="Password" name="password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password"
          helper="At least 8 characters" error={errors.password} />
        <FormField label="Confirm password" name="confirm" type="password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" error={errors.confirm} />
        <label className="flex items-start gap-2.5 mb-5 text-sm text-muted cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-teal" />
          <span>
            I understand ShiftProof stores my shift data in my ShiftProof account.{' '}
            <a href="/privacy" className="text-teal font-medium hover:underline">Learn more</a>
          </span>
        </label>
        {errors.consent && <p className="text-sm text-caution font-medium mb-4">{errors.consent}</p>}
        <ShinyButton type="submit" disabled={!consent || busy}>Create account</ShinyButton>
      </form>
      <p className="text-sm text-muted text-center mt-5">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-teal font-medium hover:underline">Sign in</button>
      </p>
    </>
  );
}

