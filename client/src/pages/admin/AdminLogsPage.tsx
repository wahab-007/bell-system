import { useEffect, useState } from 'react';
import { fetchAdminLogs } from '../../services/api';
import type { EventLog } from '../../types/api';

export const AdminLogsPage = () => {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminLogs(100)
      .then((res) => setLogs(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Event Logs</h2>
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#475467' }}>
              <th>Type</th>
              <th>Organisation</th>
              <th>Bell</th>
              <th>Timestamp</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td>{log.type}</td>
                <td>{log.organisation}</td>
                <td>{log.bell ?? '-'}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>
                  <code style={{ fontSize: 12 }}>{JSON.stringify(log.payload ?? {})}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
