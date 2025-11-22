import { Link } from 'react-router-dom';
import { useAuthStore } from '../../state/useAuthStore';

interface Props {
  title: string;
}

export const Topbar = ({ title }: Props) => {
  const { user, organisation, clear } = useAuthStore();
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}
    >
      <div>
        <p style={{ margin: 0, color: '#98a2b3' }}>Welcome to {organisation?.name ?? 'Universal Bell'}</p>
        <h1 style={{ margin: 0 }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {user?.role === 'superadmin' && (
          <Link to="/admin" className="btn btn-secondary">
            Admin Portal
          </Link>
        )}
        <span style={{ color: '#475467', fontWeight: 600 }}>{user?.email}</span>
        <button className="btn btn-secondary" onClick={clear}>
          Logout
        </button>
      </div>
    </header>
  );
};
