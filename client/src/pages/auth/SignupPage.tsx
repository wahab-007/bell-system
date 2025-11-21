import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupRequest } from '../../services/api';
import { useAuthStore } from '../../state/useAuthStore';

export const SignupPage = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({
    organisationName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    timezone: 'UTC',
  });
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await signupRequest(form);
      setSession(data);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 540, margin: '4rem auto' }}>
      <div className="card">
        <h2>Create Universal Bell Organisation</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label>
            Organisation
            <input
              required
              value={form.organisationName}
              onChange={(e) => setForm((prev) => ({ ...prev, organisationName: e.target.value }))}
              style={inputStyle}
              placeholder="Faculty of Engineering"
            />
          </label>
          <label>
            Full Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              style={inputStyle}
              placeholder="Dr. Sana Ahmed"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
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
              style={inputStyle}
            />
          </label>
          <label>
            Timezone
            <input
              value={form.timezone}
              onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              style={inputStyle}
            />
          </label>
          {error && <span style={{ color: '#d92d20' }}>{error}</span>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          Already onboard? <Link to="/login">Login</Link>
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
