import React from 'react';
import api from '../../api/client.js';
import { Link, useNavigate, useParams } from 'react-router-dom';

function AdminTenderBids() {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const [bids, setBids] = React.useState([]);
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    api
      .get(`/api/admin/tenders/${encodeURIComponent(tenderId)}/bids`)
      .then((res) => setBids(res.data || []))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load bids.'));
  }, [tenderId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Tender bids</h1>
          <p className="content__subtitle mono">{tenderId}</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      {error && <p className="form__error">{error}</p>}

      <div className="table-wrap panel">
        {bids.length === 0 ? (
          <p className="form__hint" style={{ padding: 12 }}>
            No bids for this tender.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Bid ID</th>
                <th>Supplier</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b.id}>
                  <td className="mono">{b.id}</td>
                  <td>
                    {b.bidderName}
                    {b.bidderOrganization && (
                      <div className="form__hint">{b.bidderOrganization}</div>
                    )}
                  </td>
                  <td>{b.bidAmount}</td>
                  <td>{b.status}</td>
                  <td>{b.submittedAt ? new Date(b.submittedAt).toLocaleString() : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/dashboard/tendering/bid/${encodeURIComponent(b.id)}`}
                      className="btn btn--outline btn--sm"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminTenderBids;
