import React from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client.js';

function SupplierEnquiries() {
  const { isBuyer } = useOutletContext();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    if (isBuyer) {
      setLoading(false);
      return undefined;
    }
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/materials/enquiries/incoming');
        if (!cancelled) setRows(res.data || []);
      } catch {
        if (!cancelled) setError('Could not load incoming enquiries.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isBuyer]);

  if (isBuyer) {
    return (
      <section className="view view--active">
        <header className="content__header">
          <h1 className="content__title">Incoming RFQs</h1>
          <p className="content__subtitle">Only suppliers receive buyer enquiries for their own listings.</p>
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
            <h1 className="content__title">Incoming RFQ Details</h1>
            <p className="content__subtitle">Enquiry ID: {selectedRow.id}</p>
          </div>
        </header>
        <div className="panel" style={{maxWidth: '600px'}}>
          <h3 className="panel__title" style={{marginBottom: '16px', fontSize: '18px'}}>{selectedRow.materialName}</h3>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-soft-alt)', padding: '12px', borderRadius: 'var(--radius-md)'}}>
              <div>
                <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px'}}>Buyer Name</div>
                <div style={{fontWeight: '500'}}>{selectedRow.buyerName}</div>
                <div className="mono" style={{fontSize: '11px', color: 'var(--text-muted)'}}>{selectedRow.buyerId}</div>
              </div>
              <div>
                <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px'}}>Buyer Email</div>
                <div style={{fontWeight: '500'}}>{selectedRow.buyerEmail || '—'}</div>
              </div>
            </div>
            
            <div><strong>Status:</strong> <span className="status status--info" style={{marginLeft: '8px'}}>{selectedRow.status}</span></div>
            <div><strong>Date:</strong> {selectedRow.createdAt ? new Date(selectedRow.createdAt).toLocaleString() : '—'}</div>
            
            <div style={{marginTop: '12px'}}><strong>Buyer Note:</strong></div>
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
          <h1 className="content__title">Incoming RFQs</h1>
          <p className="content__subtitle">
            Buyers who requested quotes on products you listed. Seed catalog items are not linked to your
            account — list your own products to receive RFQs here.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="panel">Loading…</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : rows.length === 0 ? (
        <div className="panel">No enquiries yet. Add product listings to start receiving RFQs.</div>
      ) : (
        <div className="table-card">
          <div className="table-card__header">
            <div className="table-card__title">Buyer enquiries</div>
            <div className="table-card__meta">{rows.length} total</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Buyer</th>
                  <th>Buyer email</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} style={{cursor: 'pointer'}} title="Click to view details">
                    <td className="mono">{r.id}</td>
                    <td>{r.materialName}</td>
                    <td>
                      {r.buyerName}
                      <div className="form__hint mono">{r.buyerId}</div>
                    </td>
                    <td className="mono">{r.buyerEmail || '—'}</td>
                    <td>{r.note && r.note.length > 20 ? r.note.substring(0, 20) + '...' : r.note || '—'}</td>
                    <td>
                      <span className="status status--info">{r.status}</span>
                    </td>
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

export default SupplierEnquiries;
