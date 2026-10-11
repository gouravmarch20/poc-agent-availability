const TONES = ['teal', 'green', 'amber', 'blue', 'purple', 'rose', 'gold', 'slate'] as const;
type Tone = (typeof TONES)[number];

const KNOWN_TONES: Record<string, Tone> = {
  new: 'green',
  beginner: 'slate',
  intermediate: 'amber',
  experienced: 'blue',
  expert: 'purple',
  certified: 'teal',
  verified: 'teal',
  'top rated': 'gold',
  premium: 'gold',
  recommended: 'rose',
  'budget friendly': 'green',
};

// Known labels keep a fixed colour everywhere; custom labels get a stable colour from their text.
function toneFor(label: string): Tone {
  const key = label.trim().toLowerCase();
  const known = KNOWN_TONES[key];
  if (known) return known;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) % TONES.length;
  return TONES[hash];
}

export default function AgentBadges({ badges }: { badges: string[] }) {
  return (
    <div className="badges">
      {badges.map((badge) => (
        <span key={badge} className={`badge badge-${toneFor(badge)}`}>
          {badge}
        </span>
      ))}
    </div>
  );
}
