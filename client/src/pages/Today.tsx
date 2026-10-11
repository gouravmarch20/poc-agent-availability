import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { Button } from '../components/Controls';
import { EmptyState, ErrorMessage, LoadingState } from '../components/Feedback';
import { useApiRequest } from '../hooks/useApiRequest';
import { listAvailability, listUpcomingDates } from '../services/availability';
import { AvailabilityItem } from '../types';
import { routesFor } from '../routes';
import AgentBadges from '../components/AgentBadges';
import DemoTip from '../components/DemoTip';
import styles from './Today.module.css';

function shiftDate(date: string, amount: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

function shortDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

export default function Today() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const routes = routesFor(user?.role ?? 'customer');
  const [dates, setDates] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [items, setItems] = useState<AvailabilityItem[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const {
    execute: loadUpcoming,
    error: upcomingError,
    clearError: clearUpcomingError,
  } = useApiRequest({ silent: true });
  const {
    execute: loadAvailability,
    error: availabilityError,
    clearError: clearAvailabilityError,
  } = useApiRequest({ silent: true });
  const error = upcomingError || availabilityError;

  useEffect(() => {
    const controller = new AbortController();
    loadUpcoming(() => listUpcomingDates(controller.signal))
      .then((data) => {
        const today = data.from;
        const visibleDates = isCustomer
          ? [shiftDate(today, -1), today, shiftDate(today, 1)]
          : [today, ...data.dates.filter((date) => date !== today)];
        setDates(visibleDates);
        setSelected(today);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setDatesLoading(false);
      });
    return () => controller.abort();
  }, [isCustomer, loadUpcoming]);

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
      {isCustomer && <DemoTip role="customer" />}
      <h1>Available agents</h1>
      <p className="meta">Times are in Asia/Kolkata. Tap a date to see who is on duty.</p>
      {error && <ErrorMessage message={error} />}
      <div className={`chips${isCustomer ? ' customer-date-options' : ''}`}>
        {datesLoading ? <LoadingState label="Loading dates..." compact /> : dates.map((date, index) => (
          <Button
            key={date}
            type="button"
            className={`chip date-chip ${date === selected ? 'active' : ''}`}
            onClick={() => {
              if (date !== selected) {
                setItemsLoading(true);
                clearUpcomingError();
                clearAvailabilityError();
                setSelected(date);
              }
            }}
          >
            {isCustomer ? (
              <>
                <span>{['Yesterday', 'Today', 'Tomorrow'][index]}</span>
                <small>{shortDate(date)}</small>
              </>
            ) : shortDate(date)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3.5 min-[720px]:grid-cols-2 mt-4">
        {itemsLoading ? <LoadingState label="Loading availability..." /> : items.length === 0 ? (
          <EmptyState message="No agents assigned for this date." />
        ) : items.map((item) => (
          <Link key={item.id} className={`card ${styles.agentCard}`} to={`${routes.viewAgent(item.agent.id)}?date=${selected}`}>
            {item.agent.coverUrl ? (
              <img src={item.agent.coverUrl} alt={item.agent.name} />
            ) : (
              <div className="placeholder" />
            )}
            <h3>{item.agent.name}</h3>
            <AgentBadges badges={item.agent.badges} />
            <div className={styles.facts}>
              <p className={styles.time}>
                <span>Available</span>
                <strong>{item.startTime} – {item.endTime}</strong>
              </p>
              <p className={styles.price}>
                <span>Session rate</span>
                <strong>{item.agent.pricing.currency} {item.agent.pricing.amount}</strong>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
