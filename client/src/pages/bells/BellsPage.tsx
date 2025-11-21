import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { BellForm } from '../../components/forms/BellForm';
import { useFetch } from '../../hooks/useFetch';
import { createBellRequest, deleteBellRequest, fetchBells, fetchBlocks, updateBellRequest } from '../../services/api';
import type { Block } from '../../types/api';

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.4rem',
  borderRadius: 8,
  border: '1px solid #d0d7f4',
};

export const BellsPage = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: '', deviceId: '', deviceSecret: '' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    data: blocks = [],
    loading: loadingBlocks,
    error: blocksError,
  } = useFetch(fetchBlocks, []);
  const { data: bells = [], refetch, loading, error } = useFetch(fetchBells, []);

  const blockName = (block: string | Block) =>
    typeof block === 'string' ? blocks.find((b) => b._id === block)?.name ?? 'Unassigned' : block.name;

  const handleCreate = async (payload: { label: string; blockId: string; deviceId: string; deviceSecret: string }) => {
    setActionError(null);
    await createBellRequest(payload);
    await refetch();
  };

  const startEdit = (id: string, label: string, deviceId: string, deviceSecret = '') => {
    setEditingId(id);
    setEditForm({ label, deviceId, deviceSecret });
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    setSaving(true);
    try {
      await deleteBellRequest(id);
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || 'Unable to delete bell');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    const payload: Partial<{ label: string; deviceId: string; deviceSecret: string }> = {
      label: editForm.label,
      deviceId: editForm.deviceId,
    };
    if (editForm.deviceSecret.trim()) {
      payload.deviceSecret = editForm.deviceSecret.trim();
    }
    await updateBellRequest(editingId, payload);
    setSaving(false);
    setEditingId(null);
    await refetch();
  };

  return (
    <>
      <Topbar title="Bells" />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Registered Bells</h3>
          {(loading || loadingBlocks) && <p>Loading...</p>}
          {(error || blocksError || actionError) && (
            <p style={{ color: '#d92d20' }}>{actionError || error || 'Failed to load bells'}</p>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#475467' }}>
                <th style={{ width: '28%' }}>Label</th>
                <th style={{ width: '22%' }}>Block</th>
                <th style={{ width: '25%' }}>Device ID</th>
                <th style={{ width: '15%' }}>Device Secret</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '10%' }} />
              </tr>
            </thead>
            <tbody>
              {bells.map((bell) => (
                <tr key={bell._id} style={{ borderBottom: '1px solid #eef0fb' }}>
                  <td>
                    {editingId === bell._id ? (
                      <input
                        value={editForm.label}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, label: e.target.value }))}
                        style={inputStyle}
                      />
                    ) : (
                      bell.label
                    )}
                  </td>
                  <td style={{ color: '#475467' }}>{blockName(bell.block)}</td>
                  <td>
                    {editingId === bell._id ? (
                      <input
                        value={editForm.deviceId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, deviceId: e.target.value }))}
                        style={inputStyle}
                      />
                    ) : (
                      bell.deviceId
                    )}
                  </td>
                  <td>
                    {editingId === bell._id ? (
                      <input
                        value={editForm.deviceSecret}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, deviceSecret: e.target.value }))}
                        style={inputStyle}
                      />
                    ) : (
                      bell.deviceSecret || '—'
                    )}
                  </td>
                  <td>
                    <span style={{ color: bell.online ? '#039855' : '#b42318' }}>
                      {bell.online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {editingId === bell._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn" onClick={() => setEditingId(null)} disabled={saving}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn"
                          onClick={() => startEdit(bell._id, bell.label, bell.deviceId, bell.deviceSecret)}
                        >
                          Edit
                        </button>
                        <button className="btn" onClick={() => handleDelete(bell._id)} disabled={saving}>
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
        <div>
          <BellForm blocks={blocks} onSubmit={handleCreate} />
        </div>
      </div>
    </>
  );
};
