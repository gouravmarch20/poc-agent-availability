import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './auth';
import { LoadingState } from './components/Feedback';
import Layout from './Layout';
import Login from './pages/Login';
import Today from './pages/Today';
import AgentDetail from './pages/AgentDetail';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import Agents from './pages/admin/Agents';
import Availability from './pages/admin/Availability';
import Users from './pages/admin/Users';
import Analytics from './pages/admin/Analytics';
import Account from './pages/Account';
import MyProfile from './pages/agent/MyProfile';
import OtherAgents from './pages/agent/OtherAgents';
import { LOGIN_ROUTE, routesFor } from './routes';
import type { User } from './types';

interface GuardProps {
  children: ReactNode;
  roles?: User['role'][];
}

function Guard({ children, roles }: GuardProps) {
  const { user, ready } = useAuth();
  if (!ready) return <LoadingState label="Checking your session..." />;
  if (!user) return <Navigate to={LOGIN_ROUTE} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={routesFor(user.role).home} replace />;
  return <>{children}</>;
}

const STAFF_ROLES: User['role'][] = ['superAdmin', 'admin'];
// Customer pages live under /customer; agents have their own two pages under /agent.
const SHARED_PAGES = [{ path: 'customer', role: 'customer' }] as const;

function Home() {
  return (
    <Guard>
      <HomeRedirect />
    </Guard>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? routesFor(user.role).home : LOGIN_ROUTE} replace />;
}

export default function App() {
  const { user, ready } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          ready && user ? <Navigate to={routesFor(user.role).home} replace /> : <Login />
        }
      />
      <Route path="/" element={<Home />} />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        {SHARED_PAGES.map(({ path, role }) => (
          <Route key={path} path={path} element={<Guard roles={[role]}><Outlet /></Guard>}>
            <Route path="view-agent" element={<Today />} />
            <Route path="view-agent/:id" element={<AgentDetail />} />
            <Route path="account" element={<Account />} />
          </Route>
        ))}
        <Route path="agent" element={<Guard roles={['agent']}><Outlet /></Guard>}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="view-agent" element={<OtherAgents />} />
        </Route>
        <Route path="admin/account" element={<Guard roles={STAFF_ROLES}><Account /></Guard>} />
        <Route
          path="/admin"
          element={
            <Guard roles={STAFF_ROLES}>
              <Dashboard />
            </Guard>
          }
        />
        <Route
          path="/admin/agents"
          element={
            <Guard roles={STAFF_ROLES}>
              <Agents />
            </Guard>
          }
        />
        <Route
          path="/admin/availability"
          element={
            <Guard roles={STAFF_ROLES}>
              <Availability />
            </Guard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <Guard roles={STAFF_ROLES}>
              <Users />
            </Guard>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <Guard roles={STAFF_ROLES}>
              <Analytics />
            </Guard>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
