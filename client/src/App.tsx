import { Navigate, Route, Routes } from 'react-router-dom';
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

interface GuardProps {
  children: ReactNode;
  staff?: boolean;
}

function Guard({ children, staff }: GuardProps) {
  const { user, ready, isStaff } = useAuth();
  if (!ready) return <LoadingState label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (staff && !isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, ready, isStaff } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          ready && user ? <Navigate to={isStaff ? '/admin' : '/'} replace /> : <Login />
        }
      />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route path="/" element={<Today />} />
        <Route path="/account" element={<Account />} />
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route
          path="/admin"
          element={
            <Guard staff>
              <Dashboard />
            </Guard>
          }
        />
        <Route
          path="/admin/agents"
          element={
            <Guard staff>
              <Agents />
            </Guard>
          }
        />
        <Route
          path="/admin/availability"
          element={
            <Guard staff>
              <Availability />
            </Guard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <Guard staff>
              <Users />
            </Guard>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <Guard staff>
              <Analytics />
            </Guard>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
