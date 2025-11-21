import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

interface Props {
  onSubmit: (payload: { name: string; description?: string }) => Promise<void>;
}

export const BlockForm = ({ onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    await onSubmit({ name, description });
    setName('');
    setDescription('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>Add Block</h3>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Science Wing"
        style={inputStyle}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Labs and classrooms"
        style={{ ...inputStyle, minHeight: 90 }}
      />
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Block'}
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
