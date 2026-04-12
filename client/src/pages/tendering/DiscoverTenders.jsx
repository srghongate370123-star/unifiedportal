import React from 'react';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';

const STATIC_CATEGORIES = [
  'All',
  'Infrastructure',
  'Technology',
  'Logistics',
  'Civil & Construction',
  'Electrical'
];

function DiscoverTenders() {
  const { isBuyer } = useOutletContext();
  const navigate = useNavigate();
  const [tenders, setTenders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

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
        if (!cancelled) setError('Failed to load tenders from the server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, category, city, state]);

  const categories = React.useMemo(() => {
    const fromData = new Set(tenders.map((x) => x.category));
    const merged = new Set([...STATIC_CATEGORIES, ...fromData]);
    return Array.from(merged);
  }, [tenders]);

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Discover tenders</h1>
          <p className="content__subtitle">
            {isBuyer
              ? 'Monitor the market and benchmark against other published opportunities.'
              : 'Find published tenders and open the detail page to submit your bid.'}
          </p>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar__search">
          <input
            type="search"
            className="input"
            placeholder="Search by keyword or tender ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
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
        </div>
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
              <div className="list-card__footer">
                <span className="list-card__tag">Closes: {t.closesIn}</span>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() =>
                    navigate(`/dashboard/tendering/tender/${t.id}`)
                  }
                >
                  View
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

export default DiscoverTenders;
