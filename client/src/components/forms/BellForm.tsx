import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { Block } from '../../types/api';

interface Props {
  blocks: Block[];
  onSubmit: (payload: { label: string; blockId: string; deviceId: string; deviceSecret: string }) => Promise<void>;
}

export const BellForm = ({ blocks, onSubmit }: Props) => {
  const [form, setForm] = useState({ label: '', blockId: '', deviceId: '', deviceSecret: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.deviceSecret.trim() || form.deviceSecret.trim().length < 6) {
      return;
    }
    setLoading(true);
    await onSubmit({
      ...form,
      label: form.label.trim(),
      deviceId: form.deviceId.trim(),
      deviceSecret: form.deviceSecret.trim(),
    });
    setForm({ label: '', blockId: '', deviceId: '', deviceSecret: '' });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>Register Bell</h3>
      <input
        required
        placeholder="Assembly Hall Bell"
        value={form.label}
        onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
        style={inputStyle}
      />
      <select
        required
        value={form.blockId}
        onChange={(e) => setForm((prev) => ({ ...prev, blockId: e.target.value }))}
        style={inputStyle}
      >
        <option value="">Select block</option>
        {blocks.map((block) => (
          <option key={block._id} value={block._id}>
            {block.name}
          </option>
        ))}
      </select>
      <input
        required
        placeholder="Device ID"
        value={form.deviceId}
        onChange={(e) => setForm((prev) => ({ ...prev, deviceId: e.target.value }))}
        style={inputStyle}
      />
      <input
        required
        placeholder="Device secret (min 6 chars)"
        value={form.deviceSecret}
        onChange={(e) => setForm((prev) => ({ ...prev, deviceSecret: e.target.value }))}
        style={inputStyle}
      />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={loading || !form.deviceSecret.trim() || form.deviceSecret.trim().length < 6}
      >
        {loading ? 'Saving...' : 'Save Bell'}
      </button>
    </form>
  );
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 12,
  border: '1px solid #d0d7f4',
};
