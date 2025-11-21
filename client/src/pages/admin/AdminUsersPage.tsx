import { useEffect, useState } from 'react';
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '../../services/api';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin', organisationId: '' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchAdminUsers();
    setUsers(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleCreate = async () => {
    setError(null);
    try {
      await createAdminUser(form);
      setForm({ name: '', email: '', password: '', role: 'admin', organisationId: '' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    setError(null);
    try {
      await updateAdminUser(id, payload);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteAdminUser(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Manage Users</h2>
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#475467' }}>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Organisation</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdate(user._id, { role: e.target.value })}
                      style={{ padding: '0.25rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                    >
                      {['viewer', 'admin', 'owner', 'superadmin'].map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{(user.organisation as any)?.name || user.organisation}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn" onClick={() => handleDelete(user._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ background: '#f8fafc' }}>
          <h4 style={{ marginTop: 0 }}>Create User</h4>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Organisation ID"
            value={form.organisationId}
            onChange={(e) => setForm((p) => ({ ...p, organisationId: e.target.value }))}
            style={inputStyle}
          />
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            style={inputStyle}
          >
            <option value="admin">admin</option>
            <option value="owner">owner</option>
            <option value="viewer">viewer</option>
            <option value="superadmin">superadmin</option>
          </select>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!form.email || !form.password || !form.name}>
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
