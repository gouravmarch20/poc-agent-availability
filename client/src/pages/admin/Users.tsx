import { useEffect, useState } from 'react';
import * as usersApi from '../../services/users';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/Feedback';
import { User } from '../../types';
import { CreateUserPayload } from '../../services/users';
import { useAuth } from '../../auth';
import { Button, DateInput, Input, Select } from '../../components/Controls';
import MoreMenu from '../../components/MoreMenu';
import styles from './Users.module.css';

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
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superAdmin';
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(empty);
  const { execute, error } = useApiRequest();
  const [loading, setLoading] = useState(true);
  const visibleUsers = isSuperAdmin ? users : users.filter((listedUser) => listedUser.role !== 'superAdmin');

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
    <div className="grid gap-4">
      <h1 className="m-0">Users</h1>
      {error && <ErrorMessage message={error} />}
      <form className="card p-[18px]" onSubmit={createUser}>
        <h2 className="mb-3.5 text-base">Create user</h2>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 min-[901px]:grid-cols-4">
          <div className="field !mb-0 min-w-0">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field !mb-0 min-w-0">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field !mb-0 min-w-0">
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className="field !mb-0 min-w-0">
            <label htmlFor="new-user-role">Role</label>
            <Select
              id="new-user-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as CreateUserPayload['role'] })}
            >
              <option value="customer">customer</option>
              <option value="admin">admin</option>
              <option value="agent">agent</option>
              {isSuperAdmin && <option value="superAdmin">superAdmin</option>}
            </Select>
          </div>
          <div className="field !mb-0 min-w-0">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field !mb-0 min-w-0">
            <DateInput label="DOB" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <Button className="min-h-11 justify-self-start whitespace-nowrap max-[600px]:w-full" type="submit">Create user</Button>
        </div>
      </form>
      <section className="card min-w-0 p-[18px]" aria-labelledby="users-list-heading">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <h2 className="m-0 text-base" id="users-list-heading">User directory</h2>
          <form
            className="w-full sm:max-w-[440px]"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              void load();
            }}
          >
            <div className="flex gap-2">
              <Input
                className="min-w-0 flex-1"
                aria-label="Search users"
                placeholder="Search name, email, phone"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button className="min-w-[86px]" type="submit" variant="secondary">Search</Button>
            </div>
          </form>
        </div>
        <div className={styles.tableScroll} role="region" aria-label="User list" tabIndex={0}>
          <table className={styles.table}>
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
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={4}><EmptyState message="No users found." /></td>
                </tr>
              ) : visibleUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    <div className="meta">{u.email}</div>
                  </td>
                  <td>
                    <span className={styles.roleBadge} data-role={u.role}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge}${u.isActive ? ` ${styles.statusActive}` : ''}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    {u.id !== user?.id && (
                      <div className={`row ${styles.tableActions}`}>
                        {u.isActive ? (
                          <MoreMenu
                            label={`Delete ${u.name}`}
                            subject={u.name}
                            confirmation="Their account will be deactivated and can be restored later."
                            onConfirm={() => { void toggle(u); }}
                            buttonText="Delete"
                          />
                        ) : (
                          <Button type="button" variant="secondary" onClick={() => toggle(u)}>
                            Restore
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
