import { useMemo, useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { useFetch } from '../../hooks/useFetch';
import {
  createBlockRequest,
  createBulbScheduleRequest,
  deleteBlockRequest,
  deleteBulbScheduleRequest,
  fetchBlocks,
  fetchBulbSchedules,
  fetchBulbs,
  toggleBulbRequest,
  updateBulbRequest,
  updateBulbScheduleRequest,
} from '../../services/api';
import { BlockForm } from '../../components/forms/BlockForm';
import type { Bulb, BulbSchedule } from '../../types/api';

export const BlocksPage = () => {
  const { data: blocks = [], loading, error, refetch } = useFetch(fetchBlocks, []);
  const { data: bulbs = [], refetch: refetchBulbs } = useFetch(fetchBulbs, []);
  const { data: bulbSchedules = [], refetch: refetchBulbSchedules } = useFetch(fetchBulbSchedules, []);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const handleCreate = async (payload: { name: string; description?: string }) => {
    await createBlockRequest(payload);
    await refetch();
    await refetchBulbs();
    await refetchBulbSchedules();
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteBlockRequest(id);
      await refetch();
      await refetchBulbs();
      await refetchBulbSchedules();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to delete block');
    }
  };

  const groupedBulbs = useMemo(() => {
    const map: Record<string, Bulb[]> = {};
    bulbs.forEach((bulb) => {
      const key = typeof bulb.block === 'string' ? bulb.block : bulb.block._id;
      map[key] = map[key] || [];
      map[key].push(bulb);
    });
    return map;
  }, [bulbs]);

  const schedulesByBulb = useMemo(() => {
    const map: Record<string, BulbSchedule[]> = {};
    bulbSchedules.forEach((schedule) => {
      const key = typeof schedule.bulb === 'string' ? schedule.bulb : schedule.bulb._id;
      map[key] = map[key] || [];
      map[key].push(schedule);
    });
    return map;
  }, [bulbSchedules]);

  const handleToggleBulb = async (bulbId: string, state: boolean) => {
    setSaving(bulbId);
    await toggleBulbRequest(bulbId, state);
    setSaving(null);
    await refetchBulbs();
  };

  const handleRenameBulb = async (bulbId: string, label: string) => {
    setSaving(bulbId);
    await updateBulbRequest(bulbId, { label });
    setSaving(null);
    await refetchBulbs();
  };

  const handleCreateSchedule = async (bulbId: string, payload: { onTime: string; offTime: string; daysOfWeek: number[] }) => {
    setSaving(bulbId);
    await createBulbScheduleRequest({ bulbId, ...payload });
    setSaving(null);
    await refetchBulbSchedules();
  };

  const handleUpdateSchedule = async (scheduleId: string, payload: Partial<{ active: boolean }>) => {
    setSaving(scheduleId);
    await updateBulbScheduleRequest(scheduleId, payload);
    setSaving(null);
    await refetchBulbSchedules();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setSaving(scheduleId);
    await deleteBulbScheduleRequest(scheduleId);
    setSaving(null);
    await refetchBulbSchedules();
  };

  return (
    <>
      <Topbar title="Blocks" />
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 2 }} className="card">
          <h3 style={{ marginTop: 0 }}>Existing Blocks</h3>
          {loading && <p>Loading...</p>}
          {(error || actionError) && <p style={{ color: '#d92d20' }}>{error || actionError}</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {blocks.map((block) => (
              <li
                key={block._id}
                style={{
                  padding: '1rem',
                  borderRadius: 12,
                  border: '1px solid #edf0fb',
                  marginBottom: '.75rem',
                }}
              >
                <strong>{block.name}</strong>
                <p style={{ margin: '.25rem 0', color: '#667085' }}>{block.description}</p>
                <BulbGrid
                  bulbs={groupedBulbs[block._id] || []}
                  schedulesByBulb={schedulesByBulb}
                  savingId={saving}
                  onToggle={handleToggleBulb}
                  onRename={handleRenameBulb}
                  onCreateSchedule={handleCreateSchedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => handleDelete(block._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <BlockForm onSubmit={handleCreate} />
        </div>
      </div>
    </>
  );
};

const BulbGrid = ({
  bulbs,
  schedulesByBulb,
  savingId,
  onToggle,
  onRename,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: {
  bulbs: Bulb[];
  schedulesByBulb: Record<string, BulbSchedule[]>;
  savingId: string | null;
  onToggle: (bulbId: string, state: boolean) => Promise<void>;
  onRename: (bulbId: string, label: string) => Promise<void>;
  onCreateSchedule: (bulbId: string, payload: { onTime: string; offTime: string; daysOfWeek: number[] }) => Promise<void>;
  onUpdateSchedule: (scheduleId: string, payload: Partial<{ active: boolean }>) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
}) => {
  if (!bulbs.length) return <p style={{ color: '#98a2b3' }}>No bulbs yet. Add a bell device to this block to control bulbs.</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
      {bulbs
        .slice()
        .sort((a, b) => a.channel - b.channel)
        .map((bulb) => (
          <div key={bulb._id} style={{ border: '1px solid #e4e7ec', borderRadius: 10, padding: '.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Bulb {bulb.channel}</p>
                <small style={{ color: '#667085' }}>{bulb.label}</small>
              </div>
              <span
                style={{
                  padding: '0.15rem 0.6rem',
                  borderRadius: 999,
                  background: bulb.state ? '#d1fadf' : '#f2f4f7',
                  color: bulb.state ? '#027a48' : '#667085',
                  fontSize: 12,
                }}
              >
                {bulb.state ? 'On' : 'Off'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
              <button className="btn btn-primary" disabled={savingId === bulb._id} onClick={() => onToggle(bulb._id, !bulb.state)}>
                {savingId === bulb._id ? 'Updating...' : bulb.state ? 'Turn Off' : 'Turn On'}
              </button>
              <RenameInput initial={bulb.label} onSave={(label) => onRename(bulb._id, label)} disabled={savingId === bulb._id} />
            </div>
            <div style={{ marginTop: '.5rem' }}>
              <ScheduleList
                bulbId={bulb._id}
                schedules={schedulesByBulb[bulb._id] || []}
                savingId={savingId}
                onCreate={onCreateSchedule}
                onUpdate={onUpdateSchedule}
                onDelete={onDeleteSchedule}
              />
            </div>
          </div>
        ))}
    </div>
  );
};

const RenameInput = ({ initial, onSave, disabled }: { initial: string; onSave: (label: string) => Promise<void>; disabled?: boolean }) => {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ display: 'flex', gap: '.4rem', flex: 1 }}>
      <input value={value} onChange={(e) => setValue(e.target.value)} style={{ flex: 1 }} />
      <button className="btn" disabled={disabled || !value.trim()} onClick={() => onSave(value)}>
        Save
      </button>
    </div>
  );
};

const ScheduleList = ({
  bulbId,
  schedules,
  savingId,
  onCreate,
  onUpdate,
  onDelete,
}: {
  bulbId: string;
  schedules: BulbSchedule[];
  savingId: string | null;
  onCreate: (bulbId: string, payload: { onTime: string; offTime: string; daysOfWeek: number[] }) => Promise<void>;
  onUpdate: (scheduleId: string, payload: Partial<{ active: boolean }>) => Promise<void>;
  onDelete: (scheduleId: string) => Promise<void>;
}) => {
  const [onTime, setOnTime] = useState('07:00');
  const [offTime, setOffTime] = useState('18:00');
  const [days, setDays] = useState('1,2,3,4,5');

  return (
    <div>
      <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>Schedules</p>
      {schedules.length === 0 && <p style={{ color: '#98a2b3' }}>None yet</p>}
      {schedules.map((s) => (
        <div
          key={s._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #f2f4f7',
            borderRadius: 8,
            padding: '.35rem .5rem',
            marginBottom: '.35rem',
          }}
        >
          <div>
            <strong>
              {s.onTime} → {s.offTime}
            </strong>
            <div style={{ color: '#667085', fontSize: 12 }}>Days: {s.repeatPattern?.daysOfWeek?.join(', ') || '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: '.35rem' }}>
            <button className="btn" disabled={savingId === s._id} onClick={() => onUpdate(s._id, { active: !s.active })}>
              {s.active ? 'Disable' : 'Enable'}
            </button>
            <button className="btn" disabled={savingId === s._id} onClick={() => onDelete(s._id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
      <div style={{ display: 'grid', gap: '.35rem', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: '.35rem' }}>
        <input value={onTime} onChange={(e) => setOnTime(e.target.value)} placeholder="On HH:MM" />
        <input value={offTime} onChange={(e) => setOffTime(e.target.value)} placeholder="Off HH:MM" />
        <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days e.g. 1,2,3" />
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: '.35rem' }}
        disabled={savingId === bulbId}
        onClick={() =>
          onCreate(bulbId, {
            onTime,
            offTime,
            daysOfWeek: days
              .split(',')
              .map((v) => Number(v.trim()))
              .filter((v) => !Number.isNaN(v)),
          })
        }
      >
        {savingId === bulbId ? 'Saving...' : 'Add schedule'}
      </button>
    </div>
  );
};
