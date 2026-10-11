import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAgent, listAgents, updateMyAgent } from '../../services/agents';
import { routesFor } from '../../routes';
import { useApiRequest } from '../../hooks/useApiRequest';
import { Button, Input, Textarea } from '../../components/Controls';
import { ErrorMessage, LoadingState } from '../../components/Feedback';
import AgentBadges from '../../components/AgentBadges';
import DemoTip from '../../components/DemoTip';
import { notifySuccess } from '../../lib/notify';
import { Agent } from '../../types';
import styles from './MyProfile.module.css';

const MAX_BIO_LENGTH = 600;

function LockedLabel({ children }: { children: string }) {
  return (
    <>
      {children} <span className={styles.lockTag}>Admin only</span>
    </>
  );
}

function toForm(agent: Agent) {
  return { name: agent.name, phone: agent.phone, bio: agent.bio ?? '' };
}

export default function MyProfile() {
  const { execute: loadProfile, error: loadError } = useApiRequest({ silent: true });
  const { execute: saveProfile } = useApiRequest();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [others, setOthers] = useState<Agent[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    loadProfile(() => getMyAgent(controller.signal))
      .then((data) => {
        setAgent(data.agent);
        setForm(toForm(data.agent));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [loadProfile]);

  // Photos for the "other agents" banner; if this fails the banner still works, just without the photo stack.
  useEffect(() => {
    const controller = new AbortController();
    listAgents(controller.signal)
      .then((data) => setOthers(data.agents.filter((item) => item.id !== agent?.id)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [agent?.id]);

  if (loadError) return <ErrorMessage message={loadError} />;
  if (!agent) return <LoadingState label="Loading your profile..." />;

  const dirty = form.name.trim() !== agent.name || form.phone.trim() !== agent.phone || form.bio.trim() !== (agent.bio ?? '');

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Enter your name.';
    else if (form.name.trim().length > 80) next.name = 'Name must be 80 characters or fewer.';
    if (form.phone.trim().length < 5) next.phone = 'Enter a phone number with at least 5 characters.';
    else if (form.phone.trim().length > 20) next.phone = 'Phone must be 20 characters or fewer.';
    if (form.bio.length > MAX_BIO_LENGTH) next.bio = `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`;
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      const data = await saveProfile(() => updateMyAgent({
        name: form.name.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
      }));
      setAgent(data.agent);
      setForm(toForm(data.agent));
      notifySuccess('Profile updated');
    } catch {
      /* the request hook shows the error as a toast */
    } finally {
      setSaving(false);
    }
  }

  const photoCount = agent.images.length;

  return (
    <div className={styles.page}>
      <DemoTip role="agent" />
      <header>
        <h1 className={styles.title}>My profile</h1>
        <p className="meta" style={{ margin: '4px 0 0' }}>This is how customers see you. You can update your name, phone and bio.</p>
      </header>

      <Link className={styles.cta} to={routesFor('agent').viewAgents}>
        <span className={styles.ctaCovers} aria-hidden="true">
          {others.slice(0, 4).map((other) => (
            other.coverUrl ? <img key={other.id} src={other.coverUrl} alt="" /> : <span key={other.id} />
          ))}
        </span>
        <span className={styles.ctaText}>
          <strong>See other agents</strong>
          <span>{others.length > 0 ? `Browse ${others.length} colleagues, their photos, rates and details` : 'Browse your colleagues, their photos, rates and details'}</span>
        </span>
        <span className={styles.ctaButton}>View other agents <span aria-hidden="true">→</span></span>
      </Link>

      <div className={styles.layout}>
        <aside className={styles.photoCard}>
          {agent.coverUrl ? (
            <img className={styles.cover} src={agent.coverUrl} alt={`${agent.name} cover`} />
          ) : (
            <div className={`${styles.cover} ${styles.noCover}`} aria-hidden="true">{agent.name.charAt(0)}</div>
          )}
          <p className={styles.photoNote}>{photoCount} {photoCount === 1 ? 'photo' : 'photos'} · photos are managed by an admin</p>
        </aside>

        <form className={`card ${styles.form}`} onSubmit={onSubmit} noValidate>
          <div className="field">
            <Input id="profile-name" label="Name" error={errors.name} value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={80} required />
          </div>
          <div className="field">
            <Input id="profile-phone" label="Phone" type="tel" inputMode="tel" error={errors.phone} value={form.phone} onChange={(e) => update('phone', e.target.value)} maxLength={20} required />
          </div>
          <div className="field">
            <Textarea
              id="profile-bio"
              label="About / bio"
              rows={5}
              error={errors.bio}
              hint={`${form.bio.length}/${MAX_BIO_LENGTH} · shown to customers on your agent page`}
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
            />
          </div>
          <div className={styles.lockedRow}>
            <div className="field">
              <Input id="profile-id" label={<LockedLabel>Agent ID</LockedLabel>} value={agent.id} disabled readOnly />
            </div>
            <div className="field">
              <Input
                id="profile-price"
                label={<LockedLabel>Session rate</LockedLabel>}
                value={`${agent.pricing.currency} ${agent.pricing.amount.toLocaleString('en-IN')}`}
                disabled
                readOnly
              />
            </div>
          </div>
          <Button type="submit" className={styles.save} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </div>

      <section className={`card ${styles.details}`} aria-labelledby="managed-heading">
        <h2 id="managed-heading" className={styles.detailsTitle}>Managed by admin</h2>
        <dl className={styles.facts}>
          <div>
            <dt>Badges</dt>
            <dd>{agent.badges.length ? <AgentBadges badges={agent.badges} /> : '—'}</dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>{agent.experienceYears === undefined ? '—' : `${agent.experienceYears} ${agent.experienceYears === 1 ? 'year' : 'years'}`}</dd>
          </div>
          <div>
            <dt>Languages</dt>
            <dd>{agent.languages?.length ? agent.languages.join(', ') : '—'}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{agent.address || '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
