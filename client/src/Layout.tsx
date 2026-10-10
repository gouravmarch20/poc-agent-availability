import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from './auth';
import { getApiActivitySnapshot, subscribeApiActivity } from './api';
import { trackPage } from './services/analytics';

export default function Layout() {
  const { user, logout, isStaff } = useAuth();
  const location = useLocation();
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

  return (
    <>
      {pendingRequests > 0 && (
        <div className="fixed inset-x-0 top-0 z-50 h-1 bg-line" role="status" aria-label="Loading data">
          <div className="h-full w-1/3 animate-pulse bg-brand" />
        </div>
      )}
      <header className="topbar relative">
        <div className="brand">Agent desk</div>
        <button
          className="menu-toggle"
          type="button"
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
        <nav id="primary-navigation" className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          {isStaff ? (
            <>
              <NavLink to="/admin" onClick={closeMenu}>Dashboard</NavLink>
              <NavLink to="/admin/agents" onClick={closeMenu}>Agents</NavLink>
              <NavLink to="/admin/availability" onClick={closeMenu}>Calendar</NavLink>
              <NavLink to="/admin/users" onClick={closeMenu}>Users</NavLink>
              <NavLink to="/admin/analytics" onClick={closeMenu}>Traffic</NavLink>
            </>
          ) : (
            <NavLink to="/" onClick={closeMenu}>Today</NavLink>
          )}
          <NavLink to="/account" onClick={closeMenu}>Account</NavLink>
          <span className="muted">{user?.name}</span>
          <button className="linkish" type="button" onClick={() => { closeMenu(); void logout(); }}>
            Logout
          </button>
        </nav>
      </header>
      <main className="shell mx-auto w-full max-w-[1100px] px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}
