import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { Bell } from '../../types/api';

interface Props {
  bells: Bell[];
  onSubmit: (payload: {
    name: string;
    bellIds: string[];
    time: string;
    durationSec: number;
    daysOfWeek: number[];
  }) => Promise<void>;
}

export const ScheduleForm = ({ bells, onSubmit }: Props) => {
  const [form, setForm] = useState({
    name: '',
    time: '08:00',
    durationSec: 5,
    daysOfWeek: [1, 2, 3, 4, 5],
  });
  const [selectedBells, setSelectedBells] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleBell = (id: string) => {
    setSelectedBells((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    await onSubmit({ ...form, bellIds: selectedBells });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>Add Bell Timing</h3>
      <input
        required
        placeholder="Morning Assembly"
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <label style={{ flex: 1 }}>
          Time
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 1 }}>
          Duration (sec)
          <input
            type="number"
            min={1}
            max={60}
            value={form.durationSec}
            onChange={(e) => setForm((prev) => ({ ...prev, durationSec: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
      </div>
      <div>
        <p style={{ fontWeight: 600 }}>Assign Bells</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {bells.map((bell) => (
            <button
              key={bell._id}
              type="button"
              onClick={() => toggleBell(bell._id)}
              className="btn"
              style={{
                border: '1px solid #d0d7f4',
                background: selectedBells.includes(bell._id) ? '#e0e7ff' : 'white',
              }}
            >
              {bell.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Days of week</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className="btn"
              style={{
                border: '1px solid #d0d7f4',
                background: form.daysOfWeek.includes(day) ? '#e0e7ff' : 'white',
              }}
            >
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day]}
            </button>
          ))}
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading || !selectedBells.length || !form.daysOfWeek.length}>
        {loading ? 'Saving...' : 'Save schedule'}
      </button>
    </form>
  );
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 12,
  border: '1px solid #d0d7f4',
  marginTop: 4,
};
