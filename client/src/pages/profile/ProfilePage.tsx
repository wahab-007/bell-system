import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { useAuthStore } from '../../state/useAuthStore';
import { api } from '../../services/api';

export const ProfilePage = () => {
  const { user, organisation, setSession, accessToken, refreshToken } = useAuthStore();
  if (!user || !organisation || !accessToken || !refreshToken) return null;
  const [profile, setProfile] = useState({ name: '', phone: '', password: '' });
  const [org, setOrg] = useState({
    name: organisation.name ?? '',
    contactEmail: organisation.contactEmail ?? '',
    contactPhone: organisation.contactPhone ?? '',
    timezone: organisation.timezone ?? 'UTC',
  });

  const updateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { data } = await api.put('/profile', profile);
    setSession({
      user: { ...user, email: data.email, organisationId: user.organisationId, role: user.role, id: user.id },
      organisation,
      accessToken,
      refreshToken,
    });
  };

  const updateOrganisation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { data } = await api.put('/profile/organisation', org);
    setSession({
      user,
      organisation: data,
      accessToken,
      refreshToken,
    });
  };

  return (
    <>
      <Topbar title="Profile & Organisation" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <form onSubmit={updateProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Profile</h3>
          <input
            placeholder="Name"
            value={profile.name}
            onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Phone"
            value={profile.phone}
            onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="New password"
            value={profile.password}
            onChange={(e) => setProfile((prev) => ({ ...prev, password: e.target.value }))}
            style={inputStyle}
          />
          <button className="btn btn-primary">Save Profile</button>
        </form>
        <form
          onSubmit={updateOrganisation}
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <h3>Organisation</h3>
          <input
            placeholder="Name"
            value={org.name}
            onChange={(e) => setOrg((prev) => ({ ...prev, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Email"
            value={org.contactEmail}
            onChange={(e) => setOrg((prev) => ({ ...prev, contactEmail: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Phone"
            value={org.contactPhone}
            onChange={(e) => setOrg((prev) => ({ ...prev, contactPhone: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Timezone"
            value={org.timezone}
            onChange={(e) => setOrg((prev) => ({ ...prev, timezone: e.target.value }))}
            style={inputStyle}
          />
          <button className="btn btn-primary">Save Organisation</button>
        </form>
      </div>
    </>
  );
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 12,
  border: '1px solid #d0d7f4',
};
