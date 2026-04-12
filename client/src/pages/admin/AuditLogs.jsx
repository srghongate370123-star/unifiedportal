import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

function AuditLogs() {
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState('');

  const refresh = React.useCallback(() => {
    api
      .get('/api/admin/tenders')
      .then((res) => setRows(res.data || []))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load tenders.'));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (id, status) => {
    try {
      if (status === 'approve') await api.patch(`/api/admin/tenders/${encodeURIComponent(id)}/approve`);
      else await api.patch(`/api/admin/tenders/${encodeURIComponent(id)}/reject`);
      refresh();
    } catch (err) {
      setError(err?.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Audit Logs</h1>
          <p className="content__subtitle">System activity logs (frontend only).</p>
        </div>
      </header>

      <div className="table-card">
        <div className="table-card__header">
          <div className="table-card__title">Tender moderation</div>
          <div className="table-card__meta">Approve / reject tenders</div>
        </div>
        {error && <p className="form__error" style={{ padding: '0 12px' }}>{error}</p>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tender</th>
                <th>Title</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Bids</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.tenderId}>
                  <td className="mono">{r.tenderId}</td>
                  <td>{r.title}</td>
                  <td>{r.status}</td>
                  <td>{r.approvalStatus || 'pending'}</td>
                  <td>
                    <Link
                      className="btn btn--ghost btn--sm"
                      to={`/dashboard/admin/tender/${encodeURIComponent(r.tenderId)}/bids`}
                    >
                      View bids
                    </Link>
                  </td>
                  <td>
                    <button className="btn btn--outline" onClick={() => act(r.tenderId, 'approve')}>Approve</button>
                    <button className="btn btn--ghost" onClick={() => act(r.tenderId, 'reject')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AuditLogs;

