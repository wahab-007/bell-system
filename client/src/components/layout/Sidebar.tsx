import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Analytics' },
  { to: '/blocks', label: 'Blocks' },
  { to: '/bells', label: 'Bells' },
  { to: '/schedules', label: 'Manage Bells' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/profile', label: 'Profile' },
];

export const Sidebar = () => {
  return (
    <aside
      style={{
        width: 240,
        background: '#101828',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        gap: '1rem',
        minHeight: '100vh',
      }}
    >
      <div>
        <p style={{ fontSize: 12, letterSpacing: 2, color: '#9da4c7' }}>UNIVERSAL</p>
        <h2 style={{ margin: 0 }}>Bell System</h2>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              padding: '.75rem 1rem',
              borderRadius: 12,
              color: isActive ? '#101828' : '#d9dffa',
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              fontWeight: 600,
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
