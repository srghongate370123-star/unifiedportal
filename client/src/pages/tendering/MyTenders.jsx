import React from 'react';
import api from '../../api/client.js';
import { useOutletContext, useNavigate } from 'react-router-dom';

function MyTenders() {
  const { isBuyer, user } = useOutletContext();
  const navigate = useNavigate();
  const [tenders, setTenders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/tenders/my');
        if (!cancelled) setTenders(res.data || []);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            (err?.code === 'ERR_NETWORK' ? 'Cannot reach the API. Start the server and use the Vite dev URL (with /api proxy), or check your connection.' : '');
          setError(
            msg ||
              'Failed to load your tenders. Sign in again if your session expired.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const rows = tenders.map((t) => ({
    ...t,
    owner: isBuyer ? 'My organization' : 'Participated',
    lastUpdated: '—'
  }));

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">My tenders</h1>
          <p className="content__subtitle">
            {isBuyer
              ? 'Tenders created by your account.'
              : 'Tenders where you have submitted a bid.'}
          </p>
        </div>
      </header>

      <div className="table-card">
        <div className="table-card__header">
          <div className="table-card__title">Tender list</div>
          <div className="table-card__meta">{rows.length} items</div>
        </div>
        {loading ? (
          <div className="table-wrap">
            <div className="panel">Loading your tenders…</div>
          </div>
        ) : error ? (
          <div className="table-wrap">
            <div className="panel">{error}</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="table-wrap">
            <div className="panel">
              {isBuyer
                ? 'No tenders yet. Create one from “New tender”, or browse featured listings on the home page.'
                : 'No bids yet. Discover published tenders and submit a quote.'}
            </div>
          </div>
        ) : (
          <div className="table-wrap" role="region" aria-label="My tenders table">
            <table className="table">
              <thead>
                <tr>
                  <th>Tender ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Closes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.category}</td>
                    <td>
                      <span className="status status--info">{t.status}</span>
                    </td>
                    <td>{t.closesIn}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() =>
                          navigate(`/dashboard/tendering/tender/${t.id}`)
                        }
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default MyTenders;
