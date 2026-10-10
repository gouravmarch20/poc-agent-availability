import { useEffect, useState } from 'react';
import * as agentsApi from '../../services/agents';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/Feedback';
import { Agent } from '../../types';

const empty = {
  name: '',
  phone: '',
  address: '',
  badges: '',
  amount: 0,
  currency: 'INR',
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const { execute, error } = useApiRequest();
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await execute(() => agentsApi.listAgents());
    setAgents(data.agents);
  }

  useEffect(() => {
    const controller = new AbortController();
    execute(() => agentsApi.listAgents(controller.signal))
      .then((data) => setAgents(data.agents))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [execute]);

  function payload() {
    return {
      name: form.name,
      phone: form.phone,
      address: form.address,
      badges: form.badges
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      pricing: { amount: Number(form.amount), currency: form.currency || 'INR' },
    };
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) {
        await execute(() => agentsApi.updateAgent(editing, payload()));
      } else {
        await execute(() => agentsApi.createAgent(payload()));
      }
      setForm(empty);
      setEditing(null);
      await load();
    } catch {
      return;
    }
  }

  async function remove(id) {
    if (!confirm('Soft-delete this agent?')) return;
    try {
      await execute(() => agentsApi.deleteAgent(id));
      await load();
    } catch {
      return;
    }
  }

  async function upload(agentId, files) {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    try {
      await execute(() => agentsApi.uploadAgentImages(agentId, fd));
      await load();
    } catch {
      return;
    }
  }

  async function deleteImage(agent, fileId) {
    try {
      await execute(() => agentsApi.deleteAgentImage(agent.id, fileId));
      await load();
    } catch {
      return;
    }
  }

  async function setCover(agent, fileId) {
    const images = agent.images.map((img, i) => ({
      fileId: img.fileId,
      order: i,
      isCover: img.fileId === fileId,
    }));
    try {
      await execute(() => agentsApi.updateAgentImages(agent.id, images));
      await load();
    } catch {
      return;
    }
  }

  return (
    <div className="grid two-col">
      <form className="card" onSubmit={save}>
        <h2>{editing ? 'Update agent' : 'New agent'}</h2>
        {error && <ErrorMessage message={error} />}
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="field">
          <label>Badges (comma separated)</label>
          <input value={form.badges} onChange={(e) => setForm({ ...form, badges: e.target.value })} />
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Amount</label>
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              required
            />
          </div>
          <div className="field" style={{ width: 100 }}>
            <label>Currency</label>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
        </div>
        <button type="submit">{editing ? 'Save' : 'Create'}</button>
        {editing && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditing(null);
              setForm(empty);
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <div>
        {loading ? <LoadingState label="Loading agents..." /> : agents.length === 0 ? (
          <EmptyState message="No agents found." />
        ) : agents.map((agent) => (
          <div key={agent.id} className="card" style={{ marginBottom: 12 }}>
            <h3>{agent.name}</h3>
            <p className="meta">
              {agent.phone} · {agent.pricing.currency} {agent.pricing.amount}
            </p>
            <p className="meta">{agent.images.length}/10 images</p>
            <div className="row">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditing(agent.id);
                  setForm({
                    name: agent.name,
                    phone: agent.phone,
                    address: agent.address,
                    badges: agent.badges.join(', '),
                    amount: agent.pricing.amount,
                    currency: agent.pricing.currency,
                  });
                }}
              >
                Edit
              </button>
              <button type="button" className="danger" onClick={() => remove(agent.id)}>
                Delete
              </button>
              <label className="button" style={{ display: 'inline-block' }}>
                Photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.length) upload(agent.id, e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div className="gallery" style={{ marginTop: 10 }}>
              {agent.images.map((img) => (
                <div key={img.fileId}>
                  <img src={img.url} alt="" />
                  <div className="row">
                    <button type="button" className="linkish" onClick={() => setCover(agent, img.fileId)}>
                      {img.isCover ? 'Cover' : 'Set cover'}
                    </button>
                    <button type="button" className="linkish" onClick={() => deleteImage(agent, img.fileId)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
