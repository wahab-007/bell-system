import { useEffect, useState } from 'react';
import {
  createAdminSchedule,
  deleteAdminSchedule,
  fetchAdminSchedules,
  updateAdminSchedule,
} from '../../services/api';

export const AdminSchedulesPage = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [form, setForm] = useState({
    organisationId: '',
    name: '',
    time: '08:00',
    durationSec: 5,
    bellIds: '',
    daysOfWeek: '1,2,3,4,5',
  });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchAdminSchedules();
    setSchedules(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleCreate = async () => {
    setError(null);
    try {
      await createAdminSchedule({
        organisationId: form.organisationId,
        name: form.name,
        time: form.time,
        durationSec: form.durationSec,
        bellIds: form.bellIds.split(',').map((b) => b.trim()),
        daysOfWeek: form.daysOfWeek
          .split(',')
          .map((d) => Number(d.trim()))
          .filter((d) => !Number.isNaN(d)),
      });
      setForm({ organisationId: '', name: '', time: '08:00', durationSec: 5, bellIds: '', daysOfWeek: '1,2,3,4,5' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    setError(null);
    try {
      await updateAdminSchedule(id, payload);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteAdminSchedule(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Manage Schedules</h2>
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#475467' }}>
                <th>Name</th>
                <th>Time</th>
                <th>Bells</th>
                <th>Org</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td>
                    <input
                      value={schedule.name}
                      onChange={(e) => handleUpdate(schedule._id, { name: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>
                    <input
                      value={schedule.time}
                      onChange={(e) => handleUpdate(schedule._id, { time: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>{(schedule.bells || []).map((b: any) => b.label || b).join(', ')}</td>
                  <td>{schedule.organisation?.name || schedule.organisation}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn" onClick={() => handleDelete(schedule._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ background: '#f8fafc' }}>
          <h4 style={{ marginTop: 0 }}>Create Schedule</h4>
          <input
            placeholder="Organisation ID"
            value={form.organisationId}
            onChange={(e) => setForm((p) => ({ ...p, organisationId: e.target.value }))}
            style={inputStyle}
          />
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="number"
            min={1}
            max={120}
            value={form.durationSec}
            onChange={(e) => setForm((p) => ({ ...p, durationSec: Number(e.target.value) }))}
            style={inputStyle}
          />
          <input
            placeholder="Bell IDs (comma)"
            value={form.bellIds}
            onChange={(e) => setForm((p) => ({ ...p, bellIds: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Days of week (0-6 comma)"
            value={form.daysOfWeek}
            onChange={(e) => setForm((p) => ({ ...p, daysOfWeek: e.target.value }))}
            style={inputStyle}
          />
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!form.organisationId || !form.name || !form.bellIds || !form.time}
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
  marginBottom: 8,
};
