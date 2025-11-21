import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fb' }}>
    <Sidebar />
    <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
      <Outlet />
    </main>
  </div>
);
