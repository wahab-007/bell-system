import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../state/useAuthStore';
import { useNavigate } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organisations', label: 'Organisations' },
  { to: '/admin/blocks', label: 'Blocks' },
  { to: '/admin/bells', label: 'Bells' },
  { to: '/admin/schedules', label: 'Schedules' },
  { to: '/admin/logs', label: 'Logs' },
  { to: '/admin/profile', label: 'Admin Profile' },
];

export const AdminLayout = () => {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const handleLogout = () => {
    clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
      <aside style={{ background: '#0b1221', color: '#e5e7eb', padding: '1.25rem 1rem' }}>
        <h2 style={{ margin: 0, color: 'white' }}>Admin</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', marginBottom: '1rem' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>{user?.email}</p>
          <button
            className="btn"
            style={{ padding: '.45rem .65rem', background: '#e11d48', color: 'white', border: 'none' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: '.65rem .85rem',
                borderRadius: 10,
                color: isActive ? '#0b1221' : '#e2e8f0',
                background: isActive ? '#e5e7eb' : 'transparent',
                fontWeight: 600,
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={{ background: '#f8fafc', padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
};
