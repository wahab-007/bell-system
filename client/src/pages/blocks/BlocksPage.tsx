import { useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { useFetch } from '../../hooks/useFetch';
import { createBlockRequest, deleteBlockRequest, fetchBlocks } from '../../services/api';
import { BlockForm } from '../../components/forms/BlockForm';

export const BlocksPage = () => {
  const { data: blocks = [], loading, error, refetch } = useFetch(fetchBlocks, []);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreate = async (payload: { name: string; description?: string }) => {
    await createBlockRequest(payload);
    await refetch();
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteBlockRequest(id);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to delete block');
    }
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
