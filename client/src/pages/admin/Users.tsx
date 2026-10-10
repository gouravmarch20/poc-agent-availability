import { useEffect, useState } from 'react';
import * as usersApi from '../../services/users';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/Feedback';
import { User } from '../../types';
import { CreateUserPayload } from '../../services/users';

const empty: CreateUserPayload = {
  name: '',
  email: '',
  password: '',
  role: 'customer',
  phone: '',
  dob: '',
  isActive: true,
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(empty);
  const { execute, error } = useApiRequest();
  const [loading, setLoading] = useState(true);

  async function load(search = q) {
    setLoading(true);
    try {
      const data = await execute(() => usersApi.listUsers(search));
      setUsers(data.users);
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    execute(() => usersApi.listUsers('', controller.signal))
      .then((data) => setUsers(data.users))
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [execute]);

  async function createUser(e) {
    e.preventDefault();
    try {
      await execute(() => usersApi.createUser(form));
      setForm(empty);
      await load();
    } catch {
      return;
    }
  }

  async function toggle(user) {
    try {
      await execute(() => usersApi.setUserActive(user.id, !user.isActive));
      await load();
    } catch {
      return;
    }
  }

  return (
    <div className="grid two-col">
      {error && <div className="col-span-full"><ErrorMessage message={error} /></div>}
      <form className="card" onSubmit={createUser}>
        <h2>Create user</h2>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
        </div>
        <div className="field">
          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as CreateUserPayload['role'] })}
          >
            <option value="customer">customer</option>
            <option value="admin">admin</option>
            <option value="agent">agent</option>
            <option value="superAdmin">superAdmin</option>
          </select>
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>DOB</label>
          <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </div>
        <button type="submit">Create</button>
      </form>
      <div className="card">
        <h2>Users</h2>
        <div className="field">
          <input
            placeholder="Search name, email, phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <button type="button" className="secondary" onClick={() => load()}>
          Search
        </button>
        <div className="users-table-scroll" role="region" aria-label="User list" tabIndex={0}>
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}><LoadingState label="Loading users..." compact /></td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4}><EmptyState message="No users found." /></td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    <div className="meta">{u.email}</div>
                  </td>
                  <td>{u.role}</td>
                  <td>{u.isActive ? 'active' : 'disabled'}</td>
                  <td>
                    <button type="button" className="secondary" onClick={() => toggle(u)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
