import React from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client.js';

function MyEnquiries() {
  const { isBuyer } = useOutletContext();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!isBuyer) {
      setLoading(false);
      return undefined;
    }
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/materials/enquiries/mine');
        if (!cancelled) setRows(res.data || []);
      } catch {
        if (!cancelled) setError('Could not load your enquiries.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isBuyer]);

  if (!isBuyer) {
    return (
      <section className="view view--active">
        <header className="content__header">
          <h1 className="content__title">My RFQs</h1>
          <p className="content__subtitle">Sign in as a buyer to track quotation requests.</p>
        </header>
      </section>
    );
  }

  const selectedRow = rows.find(r => r.id === selectedId);

  if (selectedRow) {
    return (
      <section className="view view--active">
        <header className="content__header">
          <div>
            <button className="btn btn--outline" onClick={() => setSelectedId(null)} style={{marginBottom: '16px'}}>
              &larr; Back
            </button>
            <h1 className="content__title">RFQ Details</h1>
            <p className="content__subtitle">Enquiry ID: {selectedRow.id}</p>
          </div>
        </header>
        <div className="panel" style={{maxWidth: '600px'}}>
          <h3 className="panel__title" style={{marginBottom: '16px', fontSize: '18px'}}>{selectedRow.materialName}</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px'}}>
            <div><strong>Status:</strong> <span className="status status--info" style={{marginLeft: '8px'}}>{selectedRow.status}</span></div>
            <div><strong>Date:</strong> {selectedRow.createdAt ? new Date(selectedRow.createdAt).toLocaleString() : '—'}</div>
            <div style={{marginTop: '12px'}}><strong>Your Note:</strong></div>
            <div style={{padding: '16px', background: 'var(--bg-soft-alt)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)'}}>
              {selectedRow.note || 'No additional notes provided.'}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">My RFQs</h1>
          <p className="content__subtitle">Enquiries you sent to suppliers from the marketplace.</p>
        </div>
      </header>

      {loading ? (
        <div className="panel">Loading…</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : rows.length === 0 ? (
        <div className="panel">You have not sent any enquiries yet. Browse the marketplace to request quotes.</div>
      ) : (
        <div className="table-card">
          <div className="table-card__header">
            <div className="table-card__title">Enquiries</div>
            <div className="table-card__meta">{rows.length} total</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} style={{cursor: 'pointer'}} title="Click to view details">
                    <td className="mono">{r.id}</td>
                    <td>{r.materialName}</td>
                    <td>
                      <span className="status status--info">{r.status}</span>
                    </td>
                    <td>{r.note && r.note.length > 20 ? r.note.substring(0, 20) + '...' : r.note || '—'}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default MyEnquiries;
