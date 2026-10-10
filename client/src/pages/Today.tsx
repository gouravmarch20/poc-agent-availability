import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAvailability, listUpcomingDates } from '../services/availability';
import { useApiRequest } from '../hooks/useApiRequest';
import { EmptyState, ErrorMessage, LoadingState } from '../components/Feedback';
import { AvailabilityItem } from '../types';

export default function Today() {
  const [dates, setDates] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [items, setItems] = useState<AvailabilityItem[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const {
    execute: loadUpcoming,
    error: upcomingError,
    clearError: clearUpcomingError,
  } = useApiRequest();
  const {
    execute: loadAvailability,
    error: availabilityError,
    clearError: clearAvailabilityError,
  } = useApiRequest();
  const error = upcomingError || availabilityError;

  useEffect(() => {
    const controller = new AbortController();
    loadUpcoming(() => listUpcomingDates(controller.signal))
      .then((data) => {
        const today = data.from;
        const next = [today, ...data.dates.filter((d) => d !== today)];
        setDates(next);
        setSelected(today);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setDatesLoading(false);
      });
    return () => controller.abort();
  }, [loadUpcoming]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    loadAvailability(() => listAvailability(selected, controller.signal))
      .then((data) => setItems(data.items))
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setItemsLoading(false);
      });
    return () => controller.abort();
  }, [selected, loadAvailability]);

  return (
    <div>
      <h1>Available agents</h1>
      <p className="meta">Times are in Asia/Kolkata. Tap a date to see who is on duty.</p>
      {error && <ErrorMessage message={error} />}
      <div className="chips">
        {datesLoading ? <LoadingState label="Loading dates..." compact /> : dates.map((d) => (
          <button
            key={d}
            type="button"
            className={`chip ${d === selected ? 'active' : ''}`}
            onClick={() => {
              if (d !== selected) {
                setItemsLoading(true);
                clearUpcomingError();
                clearAvailabilityError();
                setSelected(d);
              }
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid agents" style={{ marginTop: 16 }}>
        {itemsLoading ? <LoadingState label="Loading availability..." /> : items.length === 0 ? (
          <EmptyState message="No agents assigned for this date." />
        ) : items.map((item) => (
          <Link key={item.id} className="card agent-card" to={`/agents/${item.agent.id}?date=${selected}`}>
            {item.agent.coverUrl ? (
              <img src={item.agent.coverUrl} alt={item.agent.name} />
            ) : (
              <div className="placeholder" />
            )}
            <h3>{item.agent.name}</h3>
            <p className="meta">
              {item.startTime} – {item.endTime}
            </p>
            <div className="badges">
              {item.agent.badges.map((b) => (
                <span key={b} className="badge">
                  {b}
                </span>
              ))}
            </div>
            <p>
              {item.agent.pricing.currency} {item.agent.pricing.amount}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
