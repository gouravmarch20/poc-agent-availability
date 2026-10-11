import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../services/analytics';
import { listAvailability } from '../../services/availability';
import { listAgents } from '../../services/agents';
import { listUsers } from '../../services/users';
import { useApiRequest } from '../../hooks/useApiRequest';
import { ErrorMessage, LoadingState } from '../../components/Feedback';
import { AnalyticsSummary } from '../../types';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [agents, setAgents] = useState(0);
  const [today, setToday] = useState(0);
  const [users, setUsers] = useState(0);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const { execute, error, loading } = useApiRequest({ silent: true });

  useEffect(() => {
    const controller = new AbortController();
    execute(() => Promise.all([
      listAgents(controller.signal),
      listAvailability(undefined, controller.signal),
      listUsers('', controller.signal, 'customer'),
      getAnalytics(controller.signal),
    ]))
      .then(([agentData, availabilityData, userData, analyticsData]) => {
        setAgents(agentData.agents.length);
        setToday(availabilityData.items.length);
        setUsers(userData.users.length);
        setStats(analyticsData);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [execute]);

  if (error) return <ErrorMessage message={error} />;
  if (loading) return <LoadingState label="Loading dashboard..." />;

  const tiles = [
    { to: '/admin/agents', title: 'Agents', value: agents, hint: 'Add, edit and manage photos' },
    { to: '/admin/availability', title: 'Availability', value: today, hint: 'Assigned today · open calendar' },
    { to: '/admin/users', title: 'Customers', value: users, hint: 'Customer accounts and access' },
    { to: '/admin/analytics', title: 'Analytics', value: stats ? stats.today.pageViews : '—', hint: 'Page views today' },
  ];

  return (
    <div>
      <h1>Admin dashboard</h1>
      <p className="meta">Choose a section to manage.</p>
      <div className={styles.grid}>
        {tiles.map((tile) => (
          <Link key={tile.to} to={tile.to} className={styles.tile}>
            <span className={styles.tileTitle}>
              {tile.title}
              <span className={styles.arrow} aria-hidden="true">→</span>
            </span>
            <span className={styles.value}>{tile.value}</span>
            <span className={styles.hint}>{tile.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
