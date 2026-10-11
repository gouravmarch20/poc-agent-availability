import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Button, Input } from '../components/Controls';
import { ApiError } from '../api';
import { notifyError, notifySuccess } from '../lib/notify';
import { routesFor } from '../routes';
import DemoRolePicker from './DemoRolePicker';
import type { DEMO_ACCOUNTS } from '../demo/seed';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const COPY = {
  brand: 'Agent Availability',
  heading: 'Sign in',
  message: 'Keep availability and handoffs in one place.',
  emailLabel: 'Gmail address',
  emailPlaceholder: 'you@gmail.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'At least 5 characters',
  submit: 'Sign in',
  submitting: 'Signing in…',
  policy: 'Up to 7 successful sign-ins daily · Access valid for 6 months · Contact us to renew.',
  emailError: 'Enter a valid Gmail address to continue.',
  passwordError: 'Password must be at least 5 characters.',
};

const CLASSES = {
  page: 'flex min-h-dvh items-start justify-center bg-[#f6f8f6] px-4 py-6 text-ink sm:items-center sm:px-5 sm:py-8',
  form: 'signin-content w-full max-w-sm',
  brand: 'mb-6 flex items-center gap-3 sm:mb-8',
  brandMark: 'grid size-10 place-items-center rounded-lg bg-[#163f3a] font-serif text-xl font-bold text-white',
  label: 'mb-2 block text-sm font-medium text-ink',
  input: 'w-full rounded-lg border border-line bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20',
  error: 'mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800',
  submit: 'mt-6 w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-[#0b544b] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>(import.meta.env.DEV || DEMO_MODE ? 'customer@local.test' : '');
  const [password, setPassword] = useState<string>(import.meta.env.DEV || DEMO_MODE ? 'Customer@123' : '');
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [quickRole, setQuickRole] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const isGmail = isValidEmail && normalizedEmail.endsWith('@gmail.com');
    const isLocalTestAccount = (import.meta.env.DEV || DEMO_MODE)
      && isValidEmail
      && normalizedEmail.endsWith('@local.test');
    if (!isGmail && !isLocalTestAccount) {
      setError(COPY.emailError);
      return;
    }
    if (password.length < 5) {
      setError(COPY.passwordError);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(normalizedEmail, password);
      navigate(routesFor(user.role).home, { replace: true });
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : 'Login failed', { id: 'login-error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // One tap on a demo card signs in straight away and confirms who you are with a toast.
  async function quickLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    if (isSubmitting) return;
    setError('');
    setEmail(account.email);
    setPassword(account.password);
    setIsSubmitting(true);
    setQuickRole(account.label);
    try {
      const user = await login(account.email, account.password);
      notifySuccess(`You're logged in as ${account.label}`, { description: `Welcome, ${user.name}`, id: 'login-success' });
      navigate(routesFor(user.role).home, { replace: true });
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : 'Login failed', { id: 'login-error' });
      setIsSubmitting(false);
      setQuickRole(null);
    }
  }

  const emailForm = (
      <form className={CLASSES.form} onSubmit={onSubmit} autoComplete="on">
        {!DEMO_MODE && (
          <div className={CLASSES.brand}>
            <span className={CLASSES.brandMark}>A</span>
            <span className="text-sm font-semibold">{COPY.brand}</span>
          </div>
        )}

        <h1 className="font-serif text-3xl leading-tight">{COPY.heading}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{COPY.message}</p>

        {error && <p className={`${CLASSES.error} mt-5`} role="alert">{error}</p>}

        <div className="mt-6">
          <Input
            label={COPY.emailLabel}
            labelClassName={CLASSES.label}
            className={CLASSES.input}
            id="email"
            name="username"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="username"
            spellCheck={false}
            placeholder={COPY.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {import.meta.env.DEV && <p className="mt-2 text-xs text-muted">Local demo accounts ending in @local.test also work.</p>}
        </div>

        <div className="mt-4">
          <label className={CLASSES.label} htmlFor="password">{COPY.passwordLabel}</label>
          <div className="relative">
            <Input
              className={`${CLASSES.input} pr-16`}
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              minLength={5}
              placeholder={COPY.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button
              variant="linkish"
              className="absolute inset-y-0 right-3 px-2 text-sm font-semibold text-brand hover:text-[#0b544b]"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        <Button className={CLASSES.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? COPY.submitting : COPY.submit}
        </Button>
        {!DEMO_MODE && <p className="mt-4 text-center text-xs leading-5 text-muted">{COPY.policy}</p>}
      </form>
  );

  // Client demo: just a "who's exploring?" role picker.
  if (DEMO_MODE) return <DemoRolePicker onPick={(account) => { void quickLogin(account); }} pickingLabel={quickRole} />;

  return <main className={CLASSES.page}>{emailForm}</main>;
}
