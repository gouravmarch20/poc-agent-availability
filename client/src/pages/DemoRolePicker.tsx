import { DEMO_ACCOUNTS } from '../demo/seed';

type Account = (typeof DEMO_ACCOUNTS)[number];

interface DemoRolePickerProps {
  onPick: (account: Account) => void;
  pickingLabel: string | null;
}

const ICONS = {
  admin: (
    <>
      <path d="M12 3 4.5 6v5.2c0 4.6 3.1 8 7.5 9.8 4.4-1.8 7.5-5.2 7.5-9.8V6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  agent: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" />
    </>
  ),
  customer: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
} as const;

// Each role gets its own colour, like separate profiles on a streaming app.
const TONES = {
  admin: 'from-[#f2b04a] to-[#c97a12]',
  agent: 'from-[#3fb88a] to-[#1d7a5a]',
  customer: 'from-[#5b9bea] to-[#2c63b8]',
} as const;

export default function DemoRolePicker({ onPick, pickingLabel }: DemoRolePickerProps) {
  const busy = pickingLabel !== null;

  return (
    <main className="min-h-dvh bg-[#0e211d] bg-[radial-gradient(ellipse_at_top,#1b4a41_0%,#0e211d_60%)] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <div className="mb-8 flex items-center gap-3 sm:mb-10">
          <span className="grid size-10 place-items-center rounded-lg bg-white font-serif text-xl font-bold text-[#163f3a]">A</span>
          <span className="text-sm font-semibold tracking-wide">Agent Availability</span>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">Live demo</span>
        </div>

        <h1 className="text-center font-serif text-3xl leading-tight sm:text-5xl">Who’s exploring today?</h1>
        <p className="mt-3 max-w-xl text-center text-base text-white/80 sm:text-lg">
          Pick a role to see the app through that person’s eyes. Just tap one — it’s free to try and nothing here is real.
        </p>

        <div className="mt-8 grid w-full gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-6">
          {DEMO_ACCOUNTS.map((account) => {
            const loading = pickingLabel === account.label;
            return (
              <button
                key={account.email}
                type="button"
                disabled={busy}
                aria-label={`Continue as ${account.label}: ${account.tagline}`}
                aria-busy={loading}
                onClick={() => onPick(account)}
                className={`group flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-3 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-white disabled:cursor-wait sm:flex-col sm:gap-4 sm:border-transparent sm:bg-transparent sm:p-0 sm:text-center motion-safe:sm:hover:-translate-y-1 ${busy && !loading ? 'opacity-40' : ''}`}
              >
                <span className={`relative grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-lg ring-white transition group-hover:ring-4 group-focus-visible:ring-4 sm:size-40 sm:rounded-3xl ${TONES[account.tone]}`}>
                  <svg className="size-10 text-white sm:size-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {ICONS[account.tone]}
                  </svg>
                  {loading && (
                    <span className="absolute inset-0 grid place-items-center rounded-[inherit] bg-black/45">
                      <span className="size-8 animate-spin rounded-full border-4 border-white border-r-transparent" role="status" aria-label="Signing in" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 sm:flex-none">
                  <span className="block text-xl font-bold sm:text-2xl">{account.label}</span>
                  <span className="block text-sm font-semibold text-white/90">{account.tagline}</span>
                  <span className="mt-1 block text-sm leading-snug text-white/70">{account.description}</span>
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </main>
  );
}
