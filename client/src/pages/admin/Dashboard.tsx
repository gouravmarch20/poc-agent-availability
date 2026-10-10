import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../services/analytics';
import { listAvailability } from '../../services/availability';
import { listAgents } from '../../services/agents';
import { useApiRequest } from '../../hooks/useApiRequest';
import { ErrorMessage, LoadingState } from '../../components/Feedback';
import { AnalyticsSummary } from '../../types';

export default function Dashboard() {
  const [agents, setAgents] = useState(0);
  const [today, setToday] = useState(0);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const { execute, error, loading } = useApiRequest();

  useEffect(() => {
    const controller = new AbortController();
    execute(() => Promise.all([
      listAgents(controller.signal),
      listAvailability(undefined, controller.signal),
      getAnalytics(controller.signal),
    ]))
      .then(([agentData, availabilityData, analyticsData]) => {
        setAgents(agentData.agents.length);
        setToday(availabilityData.items.length);
        setStats(analyticsData);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [execute]);

  if (error) return <ErrorMessage message={error} />;
  if (loading) return <LoadingState label="Loading dashboard..." />;

  return (
    <div>
      <h1>Admin dashboard</h1>
      <div className="stats">
        <div className="card">
          <p className="meta">Active agents</p>
          <h2>{agents}</h2>
          <Link to="/admin/agents">Manage</Link>
        </div>
        <div className="card">
          <p className="meta">Assigned today</p>
          <h2>{today}</h2>
          <Link to="/admin/availability">Calendar</Link>
        </div>
        <div className="card">
          <p className="meta">Page views today</p>
          <h2>{stats ? stats.today.pageViews : '—'}</h2>
          <Link to="/admin/analytics">Traffic</Link>
        </div>
      </div>
    </div>
  );
}
