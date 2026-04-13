import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../api/client.js';

const SEED_CATEGORIES = [
  'All',
  'Infrastructure',
  'Technology',
  'Logistics',
  'Civil & Construction',
  'Electrical'
];

function PublicTenders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    const token = localStorage.getItem('up-token');
    if (!token) {
      navigate(`/login?next=${encodeURIComponent('/tenders')}`, { replace: true });
    }
  }, [navigate]);
  const categoryParam = searchParams.get('category') || 'All';

  const [tenders, setTenders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState(categoryParam);
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setCategory(categoryParam);
  }, [categoryParam]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (category && category !== 'All') params.set('category', category);
        if (city.trim()) params.set('city', city.trim());
        if (state.trim()) params.set('state', state.trim());
        const qs = params.toString();
        const res = await axios.get(qs ? `/api/tenders?${qs}` : '/api/tenders');
        if (!cancelled) setTenders(res.data || []);
      } catch {
        if (!cancelled) setError('Could not load tenders. Is the API running?');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, category, city, state]);

  const categories = React.useMemo(() => {
    const set = new Set([...SEED_CATEGORIES, ...tenders.map((t) => t.category)]);
    return Array.from(set);
  }, [tenders]);

  return (
    <div className="page page--public">
      <header className="market-header market-header--simple">
        <Link to="/" className="market-brand">
          <span className="market-brand__gem">Bharat</span>
          <span className="market-brand__im">Bazaar</span>
        </Link>
        <nav className="market-header__nav">
          <Link to="/">Home</Link>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>

      <main className="public-main">
        <h1 className="public-title">Live tenders</h1>
        <p className="public-subtitle">
          GeM-style discovery — filter by category and keyword. Sign in as a supplier to submit bids.
        </p>

        <div className="toolbar">
          <div className="toolbar__search">
            <input
              type="search"
              className="input"
              placeholder="Search by title, ID, or keyword"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input className="input" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
        </div>

        {loading ? (
          <div className="panel">Loading tenders…</div>
        ) : error ? (
          <div className="panel">{error}</div>
        ) : tenders.length === 0 ? (
          <div className="panel">No tenders match your filters.</div>
        ) : (
          <section className="grid grid--3">
            {tenders.map((t) => (
              <article key={t.id} className="list-card">
                <div className="list-card__header">
                  <span className="pill pill--gem">{t.category}</span>
                  <span className="status status--info">{t.status}</span>
                </div>
                <h3 className="list-card__title">{t.title}</h3>
                <p className="list-card__meta">Tender ID: {t.id}</p>
                {(t.city || t.state) && (
                  <p className="list-card__meta">Available in {t.city || '—'}, {t.state || '—'}</p>
                )}
                <div className="list-card__footer">
                  <span className="list-card__tag">Closes: {t.closesIn}</span>
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => navigate(`/tenders/${encodeURIComponent(t.id)}`)}
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default PublicTenders;
