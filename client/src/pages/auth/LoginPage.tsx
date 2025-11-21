import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginRequest } from '../../services/api';
import { useAuthStore } from '../../state/useAuthStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginRequest(form);
      setSession(data);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '5rem auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <img src="/bell-logo.png" alt="Bell System logo" style={{ width: 96, height: 96, objectFit: 'contain' }} />
        </div>
        <h2>Login to Universal Bell</h2>
        <p style={{ color: '#667085' }}>Manage bells, blocks, and emergency overrides.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="admin@school.edu"
              style={inputStyle}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              style={inputStyle}
            />
          </label>
          {error && <span style={{ color: '#d92d20' }}>{error}</span>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', color: '#475467' }}>
          Need an account? <Link to="/signup">Create organisation</Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 12,
  border: '1px solid #d0d7f4',
  marginTop: 4,
};
