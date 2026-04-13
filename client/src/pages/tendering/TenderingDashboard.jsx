import React from 'react';
import axios from '../../api/client.js';
import { useNavigate, useOutletContext } from 'react-router-dom';

function TenderingDashboard() {
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
        const res = await axios.get('/api/tenders');
        if (!cancelled) setTenders(res.data || []);
      } catch {
        if (!cancelled) setError('Failed to load tenders from the server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const published = tenders.filter((t) => t.status === 'Published').length;
  const drafts = tenders.filter((t) => t.status === 'Draft').length;
  const bidVolume = tenders.reduce((acc, t) => acc + (t.bids || 0), 0);

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">{isBuyer ? 'Buyer dashboard' : 'Supplier dashboard'}</h1>
          <p className="content__subtitle">
            Signed in as <strong>{user?.name}</strong>
            {user?.organization ? ` · ${user.organization}` : ''}.
          </p>
        </div>
        {isBuyer && (
          <button type="button" className="btn btn--gem" onClick={() => navigate('/dashboard/tendering/new')}>
            + New tender
          </button>
        )}
      </header>

      <section className="grid grid--3">
        <article className="stat-card stat-card--gem">
          <div className="stat-card__label">Published (global feed)</div>
          <div className="stat-card__value">{published}</div>
        </article>
        <article className="stat-card stat-card--im">
          <div className="stat-card__label">Draft tenders (feed)</div>
          <div className="stat-card__value">{drafts}</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Total bids (all listings)</div>
          <div className="stat-card__value">{bidVolume}</div>
        </article>
      </section>

      <section className="split">
        <div className="split__left">
          <header className="section-header">
            <h2 className="section-header__title">Latest tender activity</h2>
          </header>
          {loading ? (
            <div className="panel">Loading tenders…</div>
          ) : error ? (
            <div className="panel">{error}</div>
          ) : tenders.length === 0 ? (
            <div className="panel">No tenders found.</div>
          ) : (
            <div className="card-list">
              {tenders.slice(0, 8).map((tender) => (
                <article key={tender.id} className="list-card">
                  <div className="list-card__header">
                    <span className="pill pill--gem">{tender.category}</span>
                    <span className="status status--info">{tender.status}</span>
                  </div>
                  <h3 className="list-card__title">{tender.title}</h3>
                  <p className="list-card__meta">
                    ID: {tender.id} · Closes: {tender.closesIn}
                  </p>
                  <div className="list-card__footer">
                    <span className="list-card__tag">
                      {tender.bids} bid{tender.bids === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        navigate(`/dashboard/tendering/tender/${tender.id}`)
                      }
                    >
                      {isBuyer ? 'Open' : 'View / bid'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="split__right">
          <div className="info-banner info-banner--gem">
            <h3 className="info-banner__title">Next steps</h3>
            <p className="info-banner__text">
              {isBuyer
                ? 'Create a draft tender, publish it when ready, then review supplier bids on the tender page.'
                : 'Open a published tender, submit your commercial bid, and track tenders you participated in under My tenders.'}
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

export default TenderingDashboard;
