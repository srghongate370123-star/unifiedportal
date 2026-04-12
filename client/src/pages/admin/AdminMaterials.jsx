import React from 'react';
import api from '../../api/client.js';
import { useNavigate } from 'react-router-dom';

function AdminMaterials() {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState('');

  const refresh = React.useCallback(() => {
    api
      .get('/api/admin/materials')
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load products.'));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (id, action) => {
    try {
      if (action === 'approve') {
        await api.patch(`/api/admin/products/${encodeURIComponent(id)}/approve`);
      } else {
        await api.patch(`/api/admin/products/${encodeURIComponent(id)}/reject`);
      }
      refresh();
    } catch (err) {
      setError(err?.response?.data?.message || 'Action failed.');
    }
  };

  const pending = rows.filter((r) => r.approvalStatus === 'pending');

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Marketplace moderation</h1>
          <p className="content__subtitle">Approve or reject supplier product listings.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      <div className="table-card">
        <div className="table-card__header">
          <div className="table-card__title">Pending approval ({pending.length})</div>
        </div>
        {error && <p className="form__error" style={{ padding: '0 12px' }}>{error}</p>}
        <div className="table-wrap">
          {pending.length === 0 ? (
            <p className="form__hint" style={{ padding: 12 }}>
              No listings awaiting approval.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.supplier}</td>
                    <td>{r.category}</td>
                    <td>
                      <button type="button" className="btn btn--outline" onClick={() => act(r.id, 'approve')}>
                        Approve
                      </button>{' '}
                      <button type="button" className="btn btn--ghost" onClick={() => act(r.id, 'reject')}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="table-card" style={{ marginTop: 24 }}>
        <div className="table-card__header">
          <div className="table-card__title">All listings</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Approval</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.approvalStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminMaterials;
