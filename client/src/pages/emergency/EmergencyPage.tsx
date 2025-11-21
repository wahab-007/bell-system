import { useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import {
  activateEmergencyRequest,
  deactivateEmergencyRequest,
  fetchEmergencyState,
} from '../../services/api';
import { useFetch } from '../../hooks/useFetch';

export const EmergencyPage = () => {
  const { data, refetch } = useFetch(fetchEmergencyState, []);
  const [loading, setLoading] = useState(false);

  const toggle = async (activate: boolean) => {
    setLoading(true);
    if (activate) {
      await activateEmergencyRequest();
    } else {
      await deactivateEmergencyRequest();
    }
    setLoading(false);
    refetch();
  };

  const isActive = data?.active;

  return (
    <>
      <Topbar title="Emergency Bell" />
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: '#475467' }}>
          Trigger emergency bell on every block. The bells will continue to ring until the switch is disabled.
        </p>
        <div
          style={{
            margin: '2rem auto',
            width: 200,
            height: 90,
            borderRadius: 50,
            background: isActive ? '#fee4e2' : '#d1fadf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isActive ? 'flex-end' : 'flex-start',
            padding: '0 1rem',
            transition: 'all .3s ease',
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: isActive ? '#f04438' : '#12b76a',
            }}
          />
        </div>
        <button
          className="btn btn-primary"
          disabled={loading}
          onClick={() => toggle(!isActive)}
          style={{ background: isActive ? '#f04438' : undefined }}
        >
          {loading ? 'Updating...' : isActive ? 'Slide to stop' : 'Slide to trigger'}
        </button>
      </div>
    </>
  );
};
