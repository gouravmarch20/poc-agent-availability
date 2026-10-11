import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getAgent } from '../services/agents';
import { listAvailability } from '../services/availability';
import { useApiRequest } from '../hooks/useApiRequest';
import { ErrorMessage, LoadingState } from '../components/Feedback';
import { Agent, AgentImage } from '../types';
import { useAuth } from '../auth';
import { routesFor } from '../routes';
import AgentBadges from '../components/AgentBadges';
import styles from './AgentDetail.module.css';

function longDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function Gallery({ images, name }: { images: AgentImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;
  const go = useCallback((step: number) => setActive((index) => (index + step + count) % count), [count]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, go]);

  if (count === 0) return null;
  const current = images[active];

  return (
    <div className={styles.gallery}>
      <button type="button" className={styles.stage} onClick={() => setOpen(true)} aria-label="Open photo preview">
        <img src={current.url} alt={`${name}, photo ${active + 1}`} />
        <span className={styles.zoomHint}>Tap to enlarge</span>
      </button>
      {count > 1 && (
        <div className={styles.thumbs}>
          {images.map((image, index) => (
            <button
              key={image.fileId}
              type="button"
              className={`${styles.thumb}${index === active ? ` ${styles.thumbActive}` : ''}`}
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === active}
            >
              <img src={image.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${name} photos`} onClick={() => setOpen(false)}>
          <img className={styles.overlayImage} src={current.url} alt={`${name}, photo ${active + 1}`} onClick={(event) => event.stopPropagation()} />
          <button type="button" className={`${styles.overlayButton} ${styles.close}`} onClick={() => setOpen(false)} aria-label="Close preview">×</button>
          {count > 1 && (
            <>
              <button type="button" className={`${styles.overlayButton} ${styles.prev}`} onClick={(event) => { event.stopPropagation(); go(-1); }} aria-label="Previous photo">‹</button>
              <button type="button" className={`${styles.overlayButton} ${styles.next}`} onClick={(event) => { event.stopPropagation(); go(1); }} aria-label="Next photo">›</button>
              <span className={styles.counter}>{active + 1} / {count}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const date = params.get('date');
  const { execute, error } = useApiRequest({ silent: true });
  const [agentResult, setAgentResult] = useState<{ id: string | undefined; agent: Agent } | null>(null);
  const [hoursResult, setHoursResult] = useState<{ date: string; hours: string } | null>(null);
  const agent = agentResult && agentResult.id === id ? agentResult.agent : null;
  const hours = date && hoursResult?.date === date ? hoursResult.hours : null;

  useEffect(() => {
    const controller = new AbortController();
    const availabilityRequest = date
      ? listAvailability(date, controller.signal)
      : Promise.resolve(null);
    execute(() => Promise.all([getAgent(id, controller.signal), availabilityRequest]))
      .then(([agentData, availabilityData]) => {
        setAgentResult({ id, agent: agentData.agent });
        if (date && availabilityData) {
          const match = availabilityData.items.find((item) => item.agent.id === id);
          if (match) setHoursResult({ date, hours: `${match.startTime} – ${match.endTime}` });
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [id, date, execute]);

  if (error) return <ErrorMessage message={error} />;
  if (!agent) return <LoadingState label="Loading agent..." />;

  const images = [...agent.images].sort((a, b) => a.order - b.order);

  return (
    <div>
      <Link className={styles.back} to={routesFor(user?.role ?? 'customer').viewAgents}>← All agents</Link>
      <div className={styles.layout}>
        <Gallery key={agent.id} images={images} name={agent.name} />

        <div className={styles.info}>
          <div>
            <h1 className={styles.name}>{agent.name}</h1>
            <AgentBadges badges={agent.badges} />
          </div>

          {date && (
            <div className={styles.availability}>
              <span className={styles.dot} aria-hidden="true" />
              {hours ? (
                <>
                  <span className={styles.availabilityTime}>Available {hours}</span>
                  <span className={styles.availabilityDate}>{longDate(date)}</span>
                </>
              ) : (
                <span className={styles.availabilityDate}>Not on duty on {longDate(date)}</span>
              )}
            </div>
          )}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Session rate</span>
              <span className={styles.statValue}>
                <small>{agent.pricing.currency}</small>
                {agent.pricing.amount.toLocaleString('en-IN')}
              </span>
            </div>
            {agent.experienceYears !== undefined && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Experience</span>
                <span className={styles.statValue}>
                  {agent.experienceYears}
                  <small className={styles.statUnit}>{agent.experienceYears === 1 ? 'year' : 'years'}</small>
                </span>
              </div>
            )}
          </div>

          {agent.bio && (
            <section className={styles.about} aria-labelledby="about-heading">
              <h2 id="about-heading" className={styles.sectionTitle}>About {agent.name.split(' ')[0]}</h2>
              <p className={styles.bio}>{agent.bio}</p>
            </section>
          )}

          <div className={styles.contact}>
            {agent.languages && agent.languages.length > 0 && (
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>Languages</span>
                <ul className={styles.languages}>
                  {agent.languages.map((language) => <li key={language}>{language}</li>)}
                </ul>
              </div>
            )}
            <div className={styles.contactRow}>
              <span className={styles.contactLabel}>Address</span>
              {agent.address ? (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agent.address)}`} target="_blank" rel="noreferrer">
                  {agent.address}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
