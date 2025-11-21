import { useEffect, useState } from 'react';
import { createAdminBell, deleteAdminBell, fetchAdminBells, updateAdminBell } from '../../services/api';

export const AdminBellsPage = () => {
  const [bells, setBells] = useState<any[]>([]);
  const [form, setForm] = useState({
    organisationId: '',
    blockId: '',
    label: '',
    deviceId: '',
    deviceSecret: '',
    capabilities: '',
  });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchAdminBells();
    setBells(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleCreate = async () => {
    setError(null);
    try {
      await createAdminBell({
        organisationId: form.organisationId,
        blockId: form.blockId,
        label: form.label,
        deviceId: form.deviceId,
        deviceSecret: form.deviceSecret,
        capabilities: form.capabilities ? form.capabilities.split(',').map((c) => c.trim()) : [],
      });
      setForm({ organisationId: '', blockId: '', label: '', deviceId: '', deviceSecret: '', capabilities: '' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    setError(null);
    try {
      await updateAdminBell(id, payload);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteAdminBell(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Manage Bells</h2>
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#475467' }}>
                <th>Label</th>
                <th>Device</th>
                <th>Secret</th>
                <th>Block</th>
                <th>Org</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bells.map((bell) => (
                <tr key={bell._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td>
                    <input
                      value={bell.label}
                      onChange={(e) => handleUpdate(bell._id, { label: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>
                    <input
                      value={bell.deviceId}
                      onChange={(e) => handleUpdate(bell._id, { deviceId: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>
                    <input
                      value={bell.deviceSecret || ''}
                      onChange={(e) => handleUpdate(bell._id, { deviceSecret: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>{bell.block?.name || bell.block}</td>
                  <td>{bell.organisation?.name || bell.organisation}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn" onClick={() => handleDelete(bell._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ background: '#f8fafc' }}>
          <h4 style={{ marginTop: 0 }}>Create Bell</h4>
          <input
            placeholder="Organisation ID"
            value={form.organisationId}
            onChange={(e) => setForm((p) => ({ ...p, organisationId: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Block ID"
            value={form.blockId}
            onChange={(e) => setForm((p) => ({ ...p, blockId: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Label"
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Device ID"
            value={form.deviceId}
            onChange={(e) => setForm((p) => ({ ...p, deviceId: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Device Secret"
            value={form.deviceSecret}
            onChange={(e) => setForm((p) => ({ ...p, deviceSecret: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Capabilities (comma separated)"
            value={form.capabilities}
            onChange={(e) => setForm((p) => ({ ...p, capabilities: e.target.value }))}
            style={inputStyle}
          />
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!form.organisationId || !form.blockId || !form.label || !form.deviceId || !form.deviceSecret}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
};
