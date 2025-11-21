import { useEffect, useState } from 'react';
import { createAdminBlock, deleteAdminBlock, fetchAdminBlocks, updateAdminBlock } from '../../services/api';

export const AdminBlocksPage = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [form, setForm] = useState({ organisationId: '', name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchAdminBlocks();
    setBlocks(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleCreate = async () => {
    setError(null);
    try {
      await createAdminBlock(form);
      setForm({ organisationId: '', name: '', description: '' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    setError(null);
    try {
      await updateAdminBlock(id, payload);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteAdminBlock(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Manage Blocks</h2>
      {error && <p style={{ color: '#d92d20' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#475467' }}>
                <th>Name</th>
                <th>Organisation</th>
                <th>Description</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td>
                    <input
                      value={block.name}
                      onChange={(e) => handleUpdate(block._id, { name: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td>{block.organisation}</td>
                  <td>
                    <input
                      value={block.description || ''}
                      onChange={(e) => handleUpdate(block._id, { description: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn" onClick={() => handleDelete(block._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ background: '#f8fafc' }}>
          <h4 style={{ marginTop: 0 }}>Create Block</h4>
          <input
            placeholder="Organisation ID"
            value={form.organisationId}
            onChange={(e) => setForm((p) => ({ ...p, organisationId: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Block name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            style={inputStyle}
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={!form.organisationId || !form.name}>
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
};
