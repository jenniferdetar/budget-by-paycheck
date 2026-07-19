import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark">$</span>
            Budget by Paycheck
          </NavLink>
          <nav className="app-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Pay Periods
            </NavLink>
            <NavLink to="/references" className={({ isActive }) => (isActive ? 'active' : '')}>
              References
            </NavLink>
          </nav>
          <div className="app-user">
            <span className="app-user-email">{user?.email}</span>
            <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
