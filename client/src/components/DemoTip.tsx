import { useState } from 'react';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

type TipRole = 'admin' | 'agent' | 'customer';

const TIPS: Record<TipRole, { title: string; steps: string[] }> = {
  customer: {
    title: 'Welcome! Here is how to look around',
    steps: [
      'Tap a day at the top to see which agents are available.',
      'Tap an agent’s card to read about them and see their photos.',
      'Tap a photo to view it full screen.',
    ],
  },
  agent: {
    title: 'Welcome! Here is how to look around',
    steps: [
      'Change your name, phone or about text and press Save changes.',
      'Your ID and price are locked. Only an admin can change them.',
      'Tap “View other agents” to see your colleagues.',
    ],
  },
  admin: {
    title: 'Welcome! Here is how to look around',
    steps: [
      'Tap a box below to open that section.',
      'Try it: add an agent in Agents, then choose a day for them in Availability.',
      'Press “Switch role” (top right), pick Customer, and see that agent appear.',
    ],
  },
};

function storageKey(role: TipRole) {
  return `demo:tip-dismissed:${role}`;
}

function wasDismissed(role: TipRole): boolean {
  try {
    return sessionStorage.getItem(storageKey(role)) === '1';
  } catch {
    return false;
  }
}

// A short, dismissible "how to use this page" card. It only appears in the client demo.
export default function DemoTip({ role }: { role: TipRole }) {
  const [hidden, setHidden] = useState(() => wasDismissed(role));
  if (!DEMO_MODE || hidden) return null;
  const tip = TIPS[role];

  function dismiss() {
    try {
      sessionStorage.setItem(storageKey(role), '1');
    } catch {
      /* ignore: it simply shows again next visit */
    }
    setHidden(true);
  }

  return (
    <section
      className="mb-5 rounded-2xl border-2 border-[#8fb4e6] bg-[#eaf2ff] p-4 text-[#1e3a8a]"
      aria-label="Quick tour"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#2c63b8]">Quick tour</p>
          <h2 className="mt-0.5 text-base font-bold">{tip.title}</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg bg-[#2c63b8] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#1e4a85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c63b8] focus-visible:ring-offset-2"
        >
          Got it
        </button>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {tip.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2.5 text-sm leading-snug">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#2c63b8] text-xs font-bold text-white">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
