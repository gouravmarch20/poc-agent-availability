import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Button, Input } from '../components/Controls';
import { ApiError } from '../api';
import { notifyError } from '../lib/notify';
import { routesFor } from '../routes';
import { DEMO_ACCOUNTS } from '../demo/seed';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Dark text on a light tint of each role colour keeps the role icons readable.
const DEMO_TONES = {
  admin: 'bg-[#fff0dc] text-[#6b4510]',
  agent: 'bg-[#dff1e8] text-[#145b43]',
  customer: 'bg-[#e1ecfa] text-[#1e4a85]',
} as const;

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
  page: 'flex min-h-screen items-center justify-center bg-[#f6f8f6] px-5 py-8 text-ink',
  form: 'signin-content w-full max-w-sm',
  brand: 'mb-8 flex items-center gap-3',
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

  return (
    <main className={CLASSES.page}>
      <form className={CLASSES.form} onSubmit={onSubmit} autoComplete="on">
        <div className={CLASSES.brand}>
          <span className={CLASSES.brandMark}>A</span>
          <span className="text-sm font-semibold">{COPY.brand}</span>
        </div>

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
        {DEMO_MODE ? (
          <section className="mt-6 rounded-2xl border border-line bg-white p-4" aria-labelledby="demo-accounts-heading">
            <h2 id="demo-accounts-heading" className="text-sm font-bold text-ink">Try a demo account</h2>
            <p className="mt-1 text-sm text-[#3b4a43]">Tap a role to fill the form, then press Sign in.</p>
            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const selected = email.trim().toLowerCase() === account.email && password === account.password;
                return (
                  <button
                    key={account.email}
                    type="button"
                    aria-pressed={selected}
                    className={`flex min-h-[64px] items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${selected ? 'border-brand bg-[#eaf6f0]' : 'border-line bg-white hover:border-brand'}`}
                    onClick={() => { setEmail(account.email); setPassword(account.password); }}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full text-base font-bold ${DEMO_TONES[account.tone]}`} aria-hidden="true">
                      {account.label.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.95rem] font-bold text-ink">{account.label}</span>
                      <span className="block text-[0.82rem] leading-snug text-[#3b4a43]">{account.description}</span>
                      <span className="mt-1 block truncate font-mono text-[0.78rem] text-ink">{account.email} · {account.password}</span>
                    </span>
                    <span className={`shrink-0 text-lg font-bold ${selected ? 'text-brand' : 'text-transparent'}`} aria-hidden="true">✓</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[#3b4a43]">Demo only: changes live in this browser tab and reset when it closes.</p>
          </section>
        ) : (
          <p className="mt-4 text-center text-xs leading-5 text-muted">{COPY.policy}</p>
        )}
      </form>
    </main>
  );
}
