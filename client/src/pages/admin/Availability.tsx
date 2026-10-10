import { useEffect, useState } from 'react';
import * as agentsApi from '../../services/agents';
import * as availabilityApi from '../../services/availability';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/Feedback';
import { Agent, AvailabilityItem } from '../../types';
import { Button, DateInput, Select, TimeInput } from '../../components/Controls';
import styles from './Availability.module.css';

function todayLocal() {
  const d = new Date();
  const tz = 'Asia/Kolkata';
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

export default function Availability() {
  const minimumDate = todayLocal();
  const [date, setDate] = useState(todayLocal());
  const [agents, setAgents] = useState<Agent[]>([]);
  const [items, setItems] = useState<AvailabilityItem[]>([]);
  const [agentId, setAgentId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const { execute, error, clearError } = useApiRequest();
  const [loading, setLoading] = useState(true);

  async function load() {
    const [a, s] = await execute(() => Promise.all([
      agentsApi.listAgents(),
      availabilityApi.listAvailability(date),
    ]));
    setAgents(a.agents);
    setItems(s.items);
    if (!agentId && a.agents[0]) setAgentId(a.agents[0].id);
  }

  useEffect(() => {
    const controller = new AbortController();
    execute(() => Promise.all([
      agentsApi.listAgents(controller.signal),
      availabilityApi.listAvailability(date, controller.signal),
    ]))
      .then(([agentData, availabilityData]) => {
        setAgents(agentData.agents);
        setItems(availabilityData.items);
        setAgentId((current) => current || agentData.agents[0]?.id || '');
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, execute]);

  async function assign(e) {
    e.preventDefault();
    clearError();
    try {
      await execute(() => availabilityApi.assignAvailability({ date, agentId, startTime, endTime }));
      await load();
    } catch {
      return;
    }
  }

  async function updateSlot(slot) {
    try {
      await execute(() => availabilityApi.updateAvailability(slot.id, {
        date: slot.date,
        agentId: slot.agentId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));
      await load();
    } catch {
      return;
    }
  }

  async function remove(id) {
    try {
      await execute(() => availabilityApi.deleteAvailability(id));
      await load();
    } catch {
      return;
    }
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
        <h1 className="mb-1">Date-wise availability</h1>
        <div className="field !mb-0 w-full sm:max-w-[260px]">
          <label htmlFor="availability-date">Date (Asia/Kolkata)</label>
          <DateInput
            id="availability-date"
            value={date}
            min={minimumDate}
            onChange={(e) => {
              if (e.target.value < todayLocal()) return;
              setLoading(true);
              clearError();
              setDate(e.target.value);
            }}
          />
        </div>
      </header>
      <form className="card p-[18px]" onSubmit={assign}>
        <h2 className="mb-4 text-lg">Assign agent</h2>
        {error && <div className="mb-3"><ErrorMessage message={error} /></div>}
        <div className="grid grid-cols-1 items-end gap-3.5 md:grid-cols-2 min-[901px]:grid-cols-[minmax(220px,1.5fr)_repeat(2,minmax(130px,0.8fr))_auto]">
          <div className="field !mb-0 min-w-0">
            <label htmlFor="availability-agent">Agent</label>
            <Select
              id="availability-agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              {agents.length === 0 ? (
                <option value="">No agents available</option>
              ) : agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
            </Select>
          </div>
          <div className="field !mb-0 min-w-0">
            <label htmlFor="availability-start-time">Start</label>
            <TimeInput id="availability-start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="field !mb-0 min-w-0">
            <label htmlFor="availability-end-time">End</label>
            <TimeInput id="availability-end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <Button className="min-h-12 min-w-[100px] justify-self-start max-[600px]:w-full" type="submit" disabled={!agentId}>Assign</Button>
        </div>
      </form>
      <section className={`card ${styles.scheduleCard}`} aria-labelledby="availability-schedule-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base" id="availability-schedule-heading">Assigned agents</h2>
          {!loading && <span className={styles.scheduleCount}>{items.length} {items.length === 1 ? 'assignment' : 'assignments'}</span>}
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Agent</th>
              <th scope="col">Hours</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}><LoadingState label="Loading availability..." compact /></td>
              </tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td>{item.agent.name}</td>
                <td>
                  <div className={styles.hoursEditor}>
                    <TimeInput
                      className={styles.inlineTime}
                      aria-label={`Start time for ${item.agent.name}`}
                      value={item.startTime}
                      onChange={(e) => {
                        setItems((current) => current.map((entry) =>
                          entry.id === item.id ? { ...entry, startTime: e.target.value } : entry
                        ));
                      }}
                      onBlur={() => updateSlot(item)}
                    />
                    <span aria-hidden="true">to</span>
                    <TimeInput
                      className={styles.inlineTime}
                      aria-label={`End time for ${item.agent.name}`}
                      value={item.endTime}
                      onChange={(e) => {
                        setItems((current) => current.map((entry) =>
                          entry.id === item.id ? { ...entry, endTime: e.target.value } : entry
                        ));
                      }}
                      onBlur={() => updateSlot(item)}
                    />
                  </div>
                </td>
                <td>
                  <Button type="button" variant="danger" onClick={() => remove(item.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="No assignments for this date." />}
      </section>
    </div>
  );
}
