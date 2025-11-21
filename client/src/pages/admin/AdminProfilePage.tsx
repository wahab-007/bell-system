import { useState } from 'react';
import { updateProfileRequest, fetchProfileRequest } from '../../services/api';
import { useAuthStore } from '../../state/useAuthStore';

export const AdminProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({ email: user?.email || '', name: '', phone: '', password: '' });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus(null);
    setError(null);
    try {
      await updateProfileRequest({
        email: form.email,
        name: form.name || undefined,
        phone: form.phone || undefined,
        password: form.password || undefined,
      });
      useAuthStore.setState((state) => ({
        ...state,
        user: state.user ? { ...state.user, email: form.email || state.user.email } : state.user,
      }));
      setStatus('Profile updated');
    } catch (err) {
      setError((err as Error).message || 'Update failed');
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Admin Profile</h2>
      {status && <p style={{ color: '#039855' }}>{status}</p>}
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      <div style={{ maxWidth: 420, display: 'grid', gap: '.5rem' }}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          style={inputStyle}
        />
        <input
          placeholder="Name (optional)"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          style={inputStyle}
        />
        <input
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          style={inputStyle}
        />
        <input
          placeholder="New password (optional)"
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          style={inputStyle}
        />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.email}>
          Save Profile
        </button>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
};
