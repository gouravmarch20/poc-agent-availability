import type { User } from './types';

type Role = User['role'];

export const LOGIN_ROUTE = '/login';
export const ADMIN_ROUTE = '/admin';

// Each role owns a URL prefix so pages never collide. Agents reuse the customer page components.
function base(role: Role): string {
  if (role === 'superAdmin' || role === 'admin') return ADMIN_ROUTE;
  return role === 'agent' ? '/agent' : '/customer';
}

export function routesFor(role: Role) {
  const prefix = base(role);
  return {
    // Agents land on their own profile; customers on the agent list; staff on the dashboard.
    home: prefix === ADMIN_ROUTE ? ADMIN_ROUTE : role === 'agent' ? '/agent/profile' : `${prefix}/view-agent`,
    profile: '/agent/profile',
    viewAgents: `${prefix}/view-agent`,
    viewAgent: (id: string) => `${prefix}/view-agent/${id}`,
    account: `${prefix}/account`,
  };
}
