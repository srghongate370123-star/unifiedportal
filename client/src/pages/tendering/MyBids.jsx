import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

function MyBids() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/my-bids');
        if (!cancelled) setRows(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load bids.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">My bids</h1>
          <p className="content__subtitle">Track all submitted bids and latest status.</p>
        </div>
      </header>
      {loading ? (
        <div className="panel">Loading…</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : rows.length === 0 ? (
        <div className="panel">No bids submitted yet.</div>
      ) : (
        <div className="table-wrap panel">
          <table className="table">
            <thead>
              <tr>
                <th>Tender</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div>{r.tenderTitle || r.tenderId}</div>
                    <div className="form__hint mono">{r.tenderId}</div>
                  </td>
                  <td>{r.bidAmount || '-'}</td>
                  <td>{r.status}</td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link className="btn btn--outline btn--sm" to={`/dashboard/tendering/bid/${encodeURIComponent(r.id)}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default MyBids;

