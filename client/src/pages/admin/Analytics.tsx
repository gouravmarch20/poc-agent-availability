import { useEffect, useState } from 'react';
import { getAnalytics } from '../../services/analytics';
import { useApiRequest } from '../../hooks/useApiRequest';
import { ErrorMessage, LoadingState } from '../../components/Feedback';
import { AnalyticsSummary } from '../../types';

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const { execute, error } = useApiRequest({ silent: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    execute(() => getAnalytics(controller.signal))
      .then(setStats)
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [execute]);

  if (error) return <ErrorMessage message={error} />;
  if (loading || !stats) return <LoadingState label="Loading analytics..." />;

  const blocks: { label: string; data: AnalyticsSummary['today'] }[] = [
    { label: 'Today', data: stats.today },
    { label: 'This week', data: stats.week },
    { label: 'This month', data: stats.month },
  ];

  return (
    <div>
      <h1>Traffic</h1>
      <p className="meta">
        Counts of authenticated page views and login sessions. Cache refreshes hourly.
        {stats.cached ? ' Showing cached totals.' : ''}
      </p>
      <div className="stats">
        {blocks.map(({ label, data }) => (
          <div key={label} className="card">
            <h2>{label}</h2>
            <p>Page views: {data.pageViews}</p>
            <p>Sessions: {data.sessions}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
