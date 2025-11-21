import type { Bell } from '../../types/api';

interface Props {
  bells: Bell[];
}

export const BellStatusList = ({ bells }: Props) => (
  <div className="card">
    <h3 style={{ marginTop: 0 }}>Bell Health</h3>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      {bells.map((bell) => (
        <li
          key={bell._id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '.75rem 1rem',
            borderRadius: 12,
            background: '#f8f9ff',
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>{bell.label}</p>
            <span style={{ color: '#98a2b3', fontSize: 13 }}>Device: {bell.deviceId}</span>
          </div>
          <span
            style={{
              padding: '.35rem .75rem',
              borderRadius: 999,
              backgroundColor: bell.online ? 'rgba(34,197,94,.15)' : 'rgba(248,113,113,.15)',
              color: bell.online ? '#15803d' : '#b42318',
              fontWeight: 600,
            }}
          >
            {bell.online ? 'Online' : 'Offline'}
          </span>
        </li>
      ))}
    </ul>
  </div>
);
