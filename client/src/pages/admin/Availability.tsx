import { useEffect, useState } from 'react';
import * as agentsApi from '../../services/agents';
import * as availabilityApi from '../../services/availability';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/Feedback';
import { Agent, AvailabilityItem } from '../../types';

function todayLocal() {
  const d = new Date();
  const tz = 'Asia/Kolkata';
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

export default function Availability() {
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
    <div>
      <h1>Date-wise availability</h1>
      <div className="field" style={{ maxWidth: 220 }}>
        <label>Date (Asia/Kolkata)</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setLoading(true);
            clearError();
            setDate(e.target.value);
          }}
        />
      </div>
      <form className="card" onSubmit={assign}>
        <h2>Assign agent</h2>
        {error && <ErrorMessage message={error} />}
        <div className="grid two-col">
          <div className="field">
            <label>Agent</label>
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="field">
              <label>Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="field">
              <label>End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>
        <button type="submit">Assign</button>
      </form>
      <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Hours</th>
              <th></th>
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
                  <input
                    type="time"
                    value={item.startTime}
                    onChange={(e) => {
                      setItems((current) => current.map((entry) =>
                        entry.id === item.id ? { ...entry, startTime: e.target.value } : entry
                      ));
                    }}
                    onBlur={() => updateSlot(item)}
                  />
                  –
                  <input
                    type="time"
                    value={item.endTime}
                    onChange={(e) => {
                      setItems((current) => current.map((entry) =>
                        entry.id === item.id ? { ...entry, endTime: e.target.value } : entry
                      ));
                    }}
                    onBlur={() => updateSlot(item)}
                  />
                </td>
                <td>
                  <button type="button" className="danger" onClick={() => remove(item.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="No assignments for this date." />}
      </div>
    </div>
  );
}
