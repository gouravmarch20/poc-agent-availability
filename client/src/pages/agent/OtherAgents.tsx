import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAgent, listAgents } from '../../services/agents';
import { routesFor } from '../../routes';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/Feedback';
import AgentBadges from '../../components/AgentBadges';
import { Agent } from '../../types';
import styles from './OtherAgents.module.css';

export default function OtherAgents() {
  const { execute, error } = useApiRequest({ silent: true });
  const [agents, setAgents] = useState<Agent[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    execute(() => Promise.all([listAgents(controller.signal), getMyAgent(controller.signal)]))
      .then(([list, mine]) => setAgents(list.agents.filter((agent) => agent.id !== mine.agent.id)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [execute]);

  if (error) return <ErrorMessage message={error} />;
  if (!agents) return <LoadingState label="Loading agents..." />;

  return (
    <div className={styles.page}>
      <header>
        <Link className={styles.back} to={routesFor('agent').profile}>← My profile</Link>
        <h1 className={styles.title}>Other agents</h1>
        <p className="meta" style={{ margin: '4px 0 0' }}>{agents.length} {agents.length === 1 ? 'colleague' : 'colleagues'} on the platform.</p>
      </header>
      {agents.length === 0 ? (
        <EmptyState message="No other agents yet." />
      ) : (
        <div className={styles.grid}>
          {agents.map((agent) => (
            <article key={agent.id} className={`card ${styles.card}`}>
              {agent.coverUrl ? (
                <img className={styles.cover} src={agent.coverUrl} alt={`${agent.name}`} loading="lazy" />
              ) : (
                <div className={`${styles.cover} ${styles.noCover}`} aria-hidden="true">{agent.name.charAt(0)}</div>
              )}
              <div className={styles.body}>
                <div className={styles.head}>
                  <h2 className={styles.name}>{agent.name}</h2>
                  <span className={styles.price}>
                    <small>{agent.pricing.currency}</small> {agent.pricing.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <AgentBadges badges={agent.badges} />
                {agent.bio && <p className={styles.bio}>{agent.bio}</p>}
                <dl className={styles.facts}>
                  {agent.experienceYears !== undefined && (
                    <div>
                      <dt>Experience</dt>
                      <dd>{agent.experienceYears} {agent.experienceYears === 1 ? 'year' : 'years'}</dd>
                    </div>
                  )}
                  {agent.languages && agent.languages.length > 0 && (
                    <div>
                      <dt>Languages</dt>
                      <dd>{agent.languages.join(', ')}</dd>
                    </div>
                  )}
                  {agent.address && (
                    <div>
                      <dt>Location</dt>
                      <dd>{agent.address}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
