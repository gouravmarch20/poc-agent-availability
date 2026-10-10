import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getAgent } from '../services/agents';
import { listAvailability } from '../services/availability';
import { useApiRequest } from '../hooks/useApiRequest';
import { ErrorMessage, LoadingState } from '../components/Feedback';
import { Agent } from '../types';

export default function AgentDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const date = params.get('date');
  const { execute, error } = useApiRequest();
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
      <Link to="/">← Back</Link>
      <h1>{agent.name}</h1>
      {hours && (
        <p className="meta">
          {date}: {hours}
        </p>
      )}
      <div className="gallery">
        {images.map((img) => (
          <img key={img.fileId} src={img.url} alt={agent.name} />
        ))}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <p>
          <strong>Phone:</strong> {agent.phone}
        </p>
        <p>
          <strong>Address:</strong> {agent.address || '—'}
        </p>
        <p>
          <strong>Price:</strong> {agent.pricing.currency} {agent.pricing.amount}
        </p>
        <div className="badges">
          {agent.badges.map((b) => (
            <span key={b} className="badge">
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
