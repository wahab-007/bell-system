import { useMemo, useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { useFetch } from '../../hooks/useFetch';
import {
  createBulbScheduleRequest,
  deleteBulbScheduleRequest,
  fetchBlocks,
  fetchBulbSchedules,
  fetchBulbs,
  toggleBulbRequest,
  updateBulbRequest,
  updateBulbScheduleRequest,
} from '../../services/api';
import type { Block, Bulb, BulbSchedule } from '../../types/api';

export const BulbsPage = () => {
  const { data: bulbs = [], loading, error, refetch } = useFetch(fetchBulbs, []);
  const { data: schedules = [], refetch: refetchSchedules } = useFetch(fetchBulbSchedules, []);
  const { data: blocks = [] } = useFetch(fetchBlocks, []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, { block?: Block; bulbs: Bulb[]; schedules: Record<string, BulbSchedule[]> }> = {};
    bulbs.forEach((bulb) => {
      const blockId = typeof bulb.block === 'string' ? bulb.block : bulb.block._id;
      if (!map[blockId]) {
        map[blockId] = { block: blocks.find((b) => b._id === blockId), bulbs: [], schedules: {} };
      }
      map[blockId].bulbs.push(bulb);
    });
    schedules.forEach((sch) => {
      const bulbId = typeof sch.bulb === 'string' ? sch.bulb : sch.bulb._id;
      const blockId = sch.block;
      if (!map[blockId]) {
        map[blockId] = { block: blocks.find((b) => b._id === blockId), bulbs: [], schedules: {} };
      }
      map[blockId].schedules[bulbId] = map[blockId].schedules[bulbId] || [];
      map[blockId].schedules[bulbId].push(sch);
    });
    return map;
  }, [blocks, bulbs, schedules]);

  const handleToggle = async (bulbId: string, state: boolean) => {
    setSavingId(bulbId);
    setActionError(null);
    try {
      await toggleBulbRequest(bulbId, state);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to update bulb');
    } finally {
      setSavingId(null);
    }
  };

  const handleRename = async (bulbId: string, label: string) => {
    setSavingId(bulbId);
    setActionError(null);
    try {
      await updateBulbRequest(bulbId, { label });
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to rename bulb');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateSchedule = async (bulbId: string, payload: { onTime: string; offTime: string; daysOfWeek: number[] }) => {
    setSavingId(bulbId);
    setActionError(null);
    try {
      await createBulbScheduleRequest({ bulbId, ...payload });
      await refetchSchedules();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to create schedule');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateSchedule = async (scheduleId: string, payload: Partial<{ active: boolean }>) => {
    setSavingId(scheduleId);
    setActionError(null);
    try {
      await updateBulbScheduleRequest(scheduleId, payload);
      await refetchSchedules();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to update schedule');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setSavingId(scheduleId);
    setActionError(null);
    try {
      await deleteBulbScheduleRequest(scheduleId);
      await refetchSchedules();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to delete schedule');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <Topbar title="Bulbs" />
      {actionError && <p style={{ color: '#d92d20' }}>{actionError}</p>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
        }}
      >
        {loading && <p>Loading bulbs...</p>}
        {!loading &&
          Object.entries(grouped).map(([blockId, group]) => (
            <section key={blockId} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{group.block?.name ?? 'Block'}</h3>
                  <p style={{ margin: 0, color: '#667085' }}>{group.block?.description}</p>
                </div>
                <span style={{ color: '#98a2b3' }}>ID: {blockId}</span>
              </header>
              <div style={{ display: 'grid', gap: '.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {group.bulbs
                  .slice()
                  .sort((a, b) => a.channel - b.channel)
                  .map((bulb) => (
                    <BulbCard
                      key={bulb._id}
                      bulb={bulb}
                      schedules={group.schedules[bulb._id] || []}
                      savingId={savingId}
                      onToggle={handleToggle}
                      onRename={handleRename}
                      onCreateSchedule={handleCreateSchedule}
                      onUpdateSchedule={handleUpdateSchedule}
                      onDeleteSchedule={handleDeleteSchedule}
                    />
                  ))}
              </div>
            </section>
          ))}
      </div>
    </>
  );
};

const BulbCard = ({
  bulb,
  schedules,
  savingId,
  onToggle,
  onRename,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: {
  bulb: Bulb;
  schedules: BulbSchedule[];
  savingId: string | null;
  onToggle: (bulbId: string, state: boolean) => Promise<void>;
  onRename: (bulbId: string, label: string) => Promise<void>;
  onCreateSchedule: (bulbId: string, payload: { onTime: string; offTime: string; daysOfWeek: number[] }) => Promise<void>;
  onUpdateSchedule: (scheduleId: string, payload: Partial<{ active: boolean }>) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
}) => {
  const [label, setLabel] = useState(bulb.label);
  const [onTime, setOnTime] = useState('07:00');
  const [offTime, setOffTime] = useState('18:00');
  const [days, setDays] = useState('1,2,3,4,5');

  return (
    <div style={{ border: '1px solid #e4e7ec', borderRadius: 12, padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>Bulb {bulb.channel}</p>
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
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" style={{ flex: '1 1 120px' }} disabled={savingId === bulb._id} onClick={() => onToggle(bulb._id, !bulb.state)}>
          {savingId === bulb._id ? 'Updating...' : bulb.state ? 'Turn Off' : 'Turn On'}
        </button>
        <div style={{ display: 'flex', gap: '.4rem', flex: '2 1 180px' }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          <button className="btn" disabled={savingId === bulb._id || !label.trim()} onClick={() => onRename(bulb._id, label)}>
            Save
          </button>
        </div>
      </div>
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
              gap: '.5rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong>
                {s.onTime} → {s.offTime}
              </strong>
              <div style={{ color: '#667085', fontSize: 12 }}>Days: {s.repeatPattern?.daysOfWeek?.join(', ') || '—'}</div>
            </div>
            <div style={{ display: 'flex', gap: '.35rem' }}>
              <button className="btn" disabled={savingId === s._id} onClick={() => onUpdateSchedule(s._id, { active: !s.active })}>
                {s.active ? 'Disable' : 'Enable'}
              </button>
              <button className="btn" disabled={savingId === s._id} onClick={() => onDeleteSchedule(s._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        <div style={{ display: 'grid', gap: '.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', marginTop: '.35rem' }}>
          <input value={onTime} onChange={(e) => setOnTime(e.target.value)} placeholder="On HH:MM" />
          <input value={offTime} onChange={(e) => setOffTime(e.target.value)} placeholder="Off HH:MM" />
          <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days e.g. 1,2,3" />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: '.35rem' }}
          disabled={savingId === bulb._id}
          onClick={() =>
            onCreateSchedule(bulb._id, {
              onTime,
              offTime,
              daysOfWeek: days
                .split(',')
                .map((v) => Number(v.trim()))
                .filter((v) => !Number.isNaN(v)),
            })
          }
        >
          {savingId === bulb._id ? 'Saving...' : 'Add schedule'}
        </button>
      </div>
    </div>
  );
};
