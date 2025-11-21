import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { ScheduleForm } from '../../components/forms/ScheduleForm';
import { useFetch } from '../../hooks/useFetch';
import {
  createScheduleRequest,
  deleteScheduleRequest,
  fetchBells,
  fetchSchedules,
  updateScheduleRequest,
} from '../../services/api';
import type { Schedule } from '../../types/api';

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.4rem',
  borderRadius: 8,
  border: '1px solid #d0d7f4',
};

export const SchedulesPage = () => {
  const { data: bells = [] } = useFetch(fetchBells, []);
  const { data: schedules = [], refetch } = useFetch(fetchSchedules, []);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    time: string;
    durationSec: number;
    bellIds: string[];
    daysOfWeek: number[];
    active: boolean;
  }>({
    name: '',
    time: '08:00',
    durationSec: 5,
    bellIds: [],
    daysOfWeek: [1, 2, 3, 4, 5],
    active: true,
  });

  const handleCreate = async (payload: {
    name: string;
    bellIds: string[];
    time: string;
    durationSec: number;
    daysOfWeek: number[];
  }) => {
    setActionError(null);
    await createScheduleRequest(payload);
    await refetch();
  };

  const startEdit = (schedule: Schedule) => {
    setEditingId(schedule._id);
    setEditForm({
      name: schedule.name,
      time: schedule.time,
      durationSec: schedule.durationSec,
      bellIds: schedule.bells.map((b) => b._id),
      daysOfWeek: schedule.repeatPattern?.daysOfWeek ?? [1, 2, 3, 4, 5],
      active: schedule.active,
    });
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteScheduleRequest(id);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to delete schedule');
    }
  };

  const toggleEditBell = (id: string) => {
    setEditForm((prev) => ({
      ...prev,
      bellIds: prev.bellIds.includes(id) ? prev.bellIds.filter((b) => b !== id) : [...prev.bellIds, id],
    }));
  };

  const toggleDay = (day: number) => {
    setEditForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await updateScheduleRequest(editingId, {
      name: editForm.name,
      time: editForm.time,
      durationSec: editForm.durationSec,
      bellIds: editForm.bellIds,
      daysOfWeek: editForm.daysOfWeek,
      active: editForm.active,
    });
    setEditingId(null);
    await refetch();
  };

  return (
    <>
      <Topbar title="Manage Bell Timings" />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Configured Timings</h3>
          {actionError && <p style={{ color: '#d92d20' }}>{actionError}</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ color: '#475467', textAlign: 'left' }}>
              <tr>
                <th>Name</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Bells</th>
                <th>Days</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {schedules.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #f0f2fc' }}>
                  <td>
                    {editingId === item._id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        style={inputStyle}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td>
                    {editingId === item._id ? (
                      <input
                        type="time"
                        value={editForm.time}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                        style={inputStyle}
                      />
                    ) : (
                      item.time
                    )}
                  </td>
                  <td>
                    {editingId === item._id ? (
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={editForm.durationSec}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, durationSec: Number(e.target.value) }))}
                        style={inputStyle}
                      />
                    ) : (
                      `${item.durationSec}s`
                    )}
                  </td>
                  <td>
                    {editingId === item._id ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                        {bells.map((bell) => (
                          <button
                            key={bell._id}
                            type="button"
                            onClick={() => toggleEditBell(bell._id)}
                            className="btn"
                            style={{
                              border: '1px solid #d0d7f4',
                              background: editForm.bellIds.includes(bell._id) ? '#e0e7ff' : 'white',
                            }}
                          >
                            {bell.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      (item.bells || []).map((bell) => bell.label).join(', ') || '-'
                    )}
                  </td>
                  <td>
                    {(item.repeatPattern?.daysOfWeek ?? [1, 2, 3, 4, 5])
                      .map((d) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d])
                      .join(', ')}
                  </td>
                  <td>
                    {editingId === item._id ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <input
                          type="checkbox"
                          checked={editForm.active}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, active: e.target.checked }))}
                        />
                        Active
                      </label>
                    ) : (
                      item.active ? 'Active' : 'Paused'
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {editingId === item._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className="btn"
                              style={{
                                border: '1px solid #d0d7f4',
                                background: editForm.daysOfWeek.includes(day) ? '#e0e7ff' : 'white',
                              }}
                            >
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day]}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-primary"
                            onClick={handleUpdate}
                            disabled={!editForm.bellIds.length || !editForm.daysOfWeek.length}
                          >
                            Save
                          </button>
                          <button className="btn" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button className="btn" onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        <button className="btn" onClick={() => handleDelete(item._id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ScheduleForm bells={bells} onSubmit={handleCreate} />
      </div>
    </>
  );
};
