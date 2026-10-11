import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from './auth';
import { getApiActivitySnapshot, subscribeApiActivity } from './api';
import { trackPage } from './services/analytics';
import { Button } from './components/Controls';
import styles from './Layout.module.css';
import { routesFor } from './routes';


export default function Layout() {
  const { user, logout, isStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAgent = user?.role === 'agent';
  const isCustomer = user?.role === 'customer';
  const routes = routesFor(user?.role ?? 'customer');
  const workspaceRole = isStaff ? 'admin' : isAgent ? 'agent' : 'customer';
  const [menuState, setMenuState] = useState({ path: location.pathname, open: false });
  const menuOpen = menuState.path === location.pathname && menuState.open;
  const pendingRequests = useSyncExternalStore(
    subscribeApiActivity,
    getApiActivitySnapshot,
    getApiActivitySnapshot
  );

  useEffect(() => {
    trackPage(location.pathname).catch(() => {});
  }, [location.pathname]);

  function closeMenu() {
    setMenuState({ path: location.pathname, open: false });
  }

  function toggleMenu() {
    setMenuState({ path: location.pathname, open: !menuOpen });
  }

  const isHome = location.pathname === routes.home;

  function goBack() {
    navigate(routes.home);
  }

  // Everyone gets a minimal header. Agents have just two pages, so those are the two links; staff use the dashboard boxes.
  const simpleHeader = true;
  const navItems = isAgent
    ? [{ to: routes.profile, label: 'My profile' }, { to: routes.viewAgents, label: 'Agents' }]
    : [];
  const workspaceLabel = isStaff ? 'Operations' : isAgent ? 'Agent workspace' : 'Customer workspace';

  return (
    <>
      {pendingRequests > 0 && (
        <div className="fixed inset-x-0 top-0 z-50 h-1 bg-line" role="status" aria-label="Loading data">
          <div className="h-full w-1/3 animate-pulse bg-brand" />
        </div>
      )}
      <header className={`${styles.header} ${isCustomer ? styles.headerCustomer : ''} ${simpleHeader ? styles.headerSimple : ''}`}>
        <div className={styles.headerInner}>
          <NavLink className={styles.brand} to={routes.home} onClick={closeMenu}>
            <span className={styles.brandMark} aria-hidden="true">A</span>
            <span className={styles.brandName}>Agent Availability</span>
            {!isCustomer && <span className={`${styles.roleBadge} ${styles[`role${workspaceRole[0].toUpperCase()}${workspaceRole.slice(1)}`]}`}>{workspaceLabel}</span>}
          </NavLink>
          {!isHome && !isAgent && (
            <Button className={styles.backButton} type="button" onClick={goBack} title="Go back">
              <span aria-hidden="true">←</span>
              <span className={styles.backLabel}>Back</span>
            </Button>
          )}
        {!simpleHeader && (
          <Button
            className={styles.navToggle}
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={toggleMenu}
          >
            <span className={`${styles.navToggleIcon}${menuOpen ? ` ${styles.open}` : ''}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </Button>
        )}
        <nav id="primary-navigation" className={`${styles.nav}${menuOpen ? ` ${styles.open}` : ''}`} aria-label="Primary navigation">
          <div className={styles.navLinks}>
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                className={({ isActive }) => `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}
                to={to}
                end
                onClick={closeMenu}
              >
                {label}
              </NavLink>
            ))}
            {!isAgent && (
              <NavLink
                className={({ isActive }) => `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}
                to={routes.account}
                onClick={closeMenu}
              >
                Account
              </NavLink>
            )}
          </div>
          <div className={styles.navAccount}>
            {isStaff && <span className={styles.userName}>{user?.name}</span>}
            <Button className={styles.logout} type="button" onClick={() => { closeMenu(); void logout(); }}>
              Log out
            </Button>
          </div>
        </nav>
        </div>
      </header>
      <main className="shell mx-auto w-full max-w-[1100px] px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}
