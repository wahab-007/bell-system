import { useEffect, useState } from 'react';
import { fetchAdminHealth } from '../../services/api';

export const AdminDashboard = () => {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminHealth()
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message || 'Failed to load health'));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Admin Dashboard</h2>
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      {health ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
          <Stat label="API Status" value={health.status} />
          <Stat label="DB" value={health.db} />
          <Stat label="Redis" value={health.redis} />
          <Stat label="Users" value={health.counts?.users} />
          <Stat label="Blocks" value={health.counts?.blocks} />
          <Stat label="Bells" value={health.counts?.bells} />
          <Stat label="Schedules" value={health.counts?.schedules} />
          <Stat label="Uptime (s)" value={health.uptimeSec} />
          <Stat label="Timestamp" value={health.timestamp} />
        </div>
      ) : (
        !error && <p>Loading...</p>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '0.9rem' }}>
    <p style={{ margin: 0, color: '#475467' }}>{label}</p>
    <h3 style={{ margin: '0.2rem 0 0' }}>{String(value ?? '—')}</h3>
  </div>
);
