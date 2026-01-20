import { useMemo, useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { useFetch } from '../../hooks/useFetch';
import {
  activateBellEventRequest,
  createBellEventRequest,
  deleteBellEventRequest,
  fetchBellEvents,
  updateBellEventRequest,
} from '../../services/api';
import { useNavigate } from 'react-router-dom';
import type { BellEvent } from '../../types/api';

export const SchedulesPage = () => {
  const navigate = useNavigate();
  const { data: events = [], refetch, loading } = useFetch(fetchBellEvents, []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeEvent = useMemo(() => events.find((event) => event.active), [events]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await createBellEventRequest({ name: name.trim() });
      setName('');
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (event: BellEvent) => {
    if (event.active) return;
    setSaving(true);
    setActionError(null);
    try {
      await activateBellEventRequest(event._id);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to activate event');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (event: BellEvent) => {
    setEditingId(event._id);
    setEditingName(event.name);
  };

  const handleRename = async (eventId: string) => {
    if (!editingName.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await updateBellEventRequest(eventId, { name: editingName.trim() });
      setEditingId(null);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to rename event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: BellEvent) => {
    setSaving(true);
    setActionError(null);
    try {
      await deleteBellEventRequest(event._id);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to delete event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Manage Bell Timings" />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ marginTop: 0 }}>Bell Timing Events</h3>
              <p style={{ color: '#667085', marginTop: 4 }}>
                Activate one event to apply its schedules across all bells.
              </p>
            </div>
            {activeEvent && (
              <span
                style={{
                  alignSelf: 'center',
                  padding: '.35rem .8rem',
                  borderRadius: 999,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 600,
                }}
              >
                Active: {activeEvent.name}
              </span>
            )}
          </div>
          {actionError && <p style={{ color: '#d92d20' }}>{actionError}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem', marginTop: '1rem' }}>
            {events.map((event) => (
              <div
                key={event._id}
                style={{
                  padding: '1rem',
                  borderRadius: 16,
                  border: event.active ? '2px solid #4f46e5' : '1px solid #e4e7f8',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr auto',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  {editingId === event._id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '.45rem .6rem',
                        borderRadius: 10,
                        border: '1px solid #d0d7f4',
                      }}
                    />
                  ) : (
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{event.name}</p>
                  )}
                  <p style={{ margin: '4px 0 0', color: '#667085', fontSize: 13 }}>
                    {event.isDefault ? 'Default timing set' : 'Custom event timing'}
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.4rem',
                      padding: '.25rem .75rem',
                      borderRadius: 999,
                      background: event.active ? 'rgba(34,197,94,.15)' : 'rgba(148,163,184,.2)',
                      color: event.active ? '#15803d' : '#475569',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {event.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {editingId === event._id ? (
                    <>
                      <button className="btn btn-primary" onClick={() => handleRename(event._id)} disabled={saving}>
                        Save
                      </button>
                      <button className="btn" onClick={() => setEditingId(null)} disabled={saving}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn" onClick={() => navigate(`/schedules/${event._id}`)}>
                        Manage
                      </button>
                      <button className="btn" onClick={() => startEdit(event)} disabled={saving}>
                        Rename
                      </button>
                      {!event.active && (
                        <button className="btn btn-primary" onClick={() => handleActivate(event)} disabled={saving}>
                          Activate
                        </button>
                      )}
                      {!event.isDefault && (
                        <button className="btn" onClick={() => handleDelete(event)} disabled={saving}>
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {!loading && events.length === 0 && <p style={{ color: '#98a2b3' }}>No events yet.</p>}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Add Event</h3>
          <input
            placeholder="Ramadan Timing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '.65rem .75rem',
              borderRadius: 12,
              border: '1px solid #d0d7f4',
            }}
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Create event'}
          </button>
          <p style={{ color: '#667085', fontSize: 13 }}>
            Use events to swap between different bell timing sets like student week, Ramadan, or exams.
          </p>
        </div>
      </div>
    </>
  );
};
