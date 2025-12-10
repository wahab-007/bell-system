import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => (
  <div
    style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f4f6fb',
      flexWrap: 'wrap',
    }}
  >
    <Sidebar />
    <main
      style={{
        flex: 1,
        padding: '1.5rem',
        overflowY: 'auto',
        minWidth: '320px',
      }}
    >
      <Outlet />
    </main>
  </div>
);
