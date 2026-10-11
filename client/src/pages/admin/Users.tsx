import { FormEvent, useEffect, useState } from 'react';
import * as usersApi from '../../services/users';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, LoadingState } from '../../components/Feedback';
import { User } from '../../types';
import { CreateUserPayload } from '../../services/users';
import { Button, DateInput, Input } from '../../components/Controls';
import MoreMenu from '../../components/MoreMenu';
import styles from './Users.module.css';

type StatusFilter = 'all' | 'active' | 'disabled';

const empty: Omit<CreateUserPayload, 'role'> = {
  name: '',
  email: '',
  password: '',
  phone: '',
  dob: '',
  isActive: true,
};

function avatarHue(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

function initials(name: string): string {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function joined(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// This page manages customers only: the list is filtered to them and every new account is a customer.
export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [form, setForm] = useState(empty);
  const [notice, setNotice] = useState('');
  const { execute } = useApiRequest();
  const [loading, setLoading] = useState(true);

  const customers = users.filter((listed) => listed.role === 'customer');
  const activeCount = customers.filter((customer) => customer.isActive).length;
  const rows = customers.filter((customer) => filter === 'all' || (filter === 'active') === customer.isActive);
  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: customers.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'disabled', label: 'Disabled', count: customers.length - activeCount },
  ];

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      execute(() => usersApi.listUsers(q, controller.signal, 'customer'))
        .then((data) => setUsers(data.users))
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, q ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, execute]);

  async function refresh() {
    try {
      const data = await execute(() => usersApi.listUsers(q, undefined, 'customer'));
      setUsers(data.users);
    } catch {
      /* the request error is shown above the page */
    }
  }

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await execute(() => usersApi.createUser({ ...form, role: 'customer' }));
      setNotice(`Created ${form.name}`);
      setForm(empty);
      await refresh();
    } catch {
      setNotice('');
    }
  }

  async function toggle(customer: User) {
    try {
      await execute(() => usersApi.setUserActive(customer.id, !customer.isActive));
      setNotice('');
      await refresh();
    } catch {
      /* the request error is shown above the page */
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="m-0">Customers</h1>
        <p className="meta" style={{ margin: '4px 0 0' }}>Create customer accounts and control who can sign in.</p>
      </div>

      <form className="card p-[18px]" onSubmit={createCustomer}>
        <h2 className="mb-3.5 text-base">New customer</h2>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 min-[901px]:grid-cols-3">
          <div className="field !mb-0 min-w-0">
            <Input label="Name" value={form.name} onChange={(e) => { setNotice(''); setForm({ ...form, name: e.target.value }); }} required />
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
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field !mb-0 min-w-0">
            <DateInput label="Date of birth" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <Button className="min-h-11 justify-self-start whitespace-nowrap max-[600px]:w-full" type="submit">Create customer</Button>
        </div>
        {notice && <p className={styles.notice} role="status">✓ {notice}</p>}
      </form>

      <section className="card min-w-0 p-[18px]" aria-labelledby="users-list-heading">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <h2 className="m-0 text-base" id="users-list-heading">Customer directory</h2>
          <div className="w-full sm:max-w-[360px]" role="search">
            <Input
              aria-label="Search customers"
              placeholder="Search name, email or phone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Filter by status">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={filter === tab.key}
              className={`${styles.tab}${filter === tab.key ? ` ${styles.tabActive}` : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.tableScroll} role="region" aria-label="Customer list" tabIndex={0}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}><LoadingState label="Loading customers..." compact /></td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5}><EmptyState message="No customers found." /></td>
                </tr>
              ) : rows.map((customer) => (
                <tr key={customer.id}>
                  <td className={styles.personTd}>
                    <div className={styles.person}>
                      <span className={styles.avatar} style={{ background: `hsl(${avatarHue(customer.name)}, 45%, 38%)` }} aria-hidden="true">
                        {initials(customer.name)}
                      </span>
                      <div className={styles.personText}>
                        <span className={styles.personName}>{customer.name}</span>
                        <span className="meta">{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`${styles.muted} ${styles.detailTd}`} data-label="Phone">{customer.phone || '—'}</td>
                  <td className={`${styles.muted} ${styles.detailTd}`} data-label="Joined">{joined(customer.createdAt)}</td>
                  <td className={styles.detailTd} data-label="Status">
                    <span className={`${styles.statusBadge}${customer.isActive ? ` ${styles.statusActive}` : ''}`}>
                      {customer.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className={styles.actionsTd}>
                    <div className={`row ${styles.tableActions}`}>
                      {customer.isActive ? (
                        <MoreMenu
                          label={`Disable ${customer.name}`}
                          subject={customer.name}
                          confirmation="Their account will be disabled and can be restored later."
                          onConfirm={() => { void toggle(customer); }}
                          buttonText="Disable"
                        />
                      ) : (
                        <MoreMenu
                          label={`Restore ${customer.name}`}
                          subject={customer.name}
                          title="Restore"
                          confirmText="Restore"
                          tone="safe"
                          confirmation="Their account will be re-enabled and they can sign in again."
                          onConfirm={() => { void toggle(customer); }}
                          buttonText="Restore"
                        />
                      )}
                    </div>
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
