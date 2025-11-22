import { useEffect, useState } from 'react';
import {
  createAdminOrganisation,
  deleteAdminOrganisation,
  fetchAdminOrganisations,
  updateAdminOrganisation,
} from '../../services/api';
import { TimezoneSelect } from '../../components/TimezoneSelect';

export const AdminOrganisationsPage = () => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', contactEmail: '', contactPhone: '', timezone: 'UTC' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchAdminOrganisations();
    setOrgs(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleCreate = async () => {
    setError(null);
    try {
      await createAdminOrganisation(form);
      setForm({ name: '', contactEmail: '', contactPhone: '', timezone: 'UTC' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    setError(null);
    try {
      await updateAdminOrganisation(id, payload);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteAdminOrganisation(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Manage Organisations</h2>
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#475467' }}>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Timezone</th>
                <th>Slug</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td>
                    <input
                      value={org.name}
                      onChange={(e) => handleUpdate(org._id, { name: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>
                    <input
                      value={org.contactEmail}
                      onChange={(e) => handleUpdate(org._id, { contactEmail: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>
                    <input
                      value={org.contactPhone || ''}
                      onChange={(e) => handleUpdate(org._id, { contactPhone: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>
                    <TimezoneSelect
                      value={org.timezone || 'UTC'}
                      onChange={(tz) => handleUpdate(org._id, { timezone: tz })}
                      style={inputStyle}
                    />
                  </td>
                  <td>{org.slug}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn" onClick={() => handleDelete(org._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ background: '#f8fafc' }}>
          <h4 style={{ marginTop: 0 }}>Create Organisation</h4>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Contact Email"
            value={form.contactEmail}
            onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Contact Phone"
            value={form.contactPhone}
            onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
            style={inputStyle}
          />
          <TimezoneSelect value={form.timezone} onChange={(tz) => setForm((p) => ({ ...p, timezone: tz }))} />
          <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name || !form.contactEmail}>
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
  marginBottom: 8,
};
