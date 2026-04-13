import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../api/client.js';
import api from '../api/client.js';

function PublicMarketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    const token = localStorage.getItem('up-token');
    if (!token) {
      const path = `/marketplace${window.location.search || ''}`;
      navigate(`/login?next=${encodeURIComponent(path)}`, { replace: true });
    }
  }, [navigate]);
  const initialQ = searchParams.get('q') || '';

  const [materials, setMaterials] = React.useState([]);
  const [query, setQuery] = React.useState(initialQ);
  const [category, setCategory] = React.useState('All');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [sentFor, setSentFor] = React.useState({});

  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('up-user') || 'null');
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

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
        if (minPrice.trim()) params.set('minPrice', minPrice.trim());
        if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim());
        const qs = params.toString();
        const res = await axios.get(qs ? `/api/materials?${qs}` : '/api/materials');
        if (!cancelled) setMaterials(res.data || []);
      } catch {
        if (!cancelled) setError('Could not load products. Is the API running?');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, category, city, state, minPrice, maxPrice]);

  const categories = React.useMemo(() => {
    const set = new Set(materials.map((m) => m.category));
    return ['All', ...Array.from(set)];
  }, [materials]);

  const requestQuote = async (mat) => {
    const token = localStorage.getItem('up-token');
    if (!token || user?.role !== 'buyer') {
      navigate(`/login?next=${encodeURIComponent(`/marketplace#${mat.id}`)}`);
      return;
    }
    try {
      await api.post('/api/materials/enquiry', {
        materialId: mat.id,
        note: ''
      });
      setSentFor((prev) => ({ ...prev, [mat.id]: true }));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not send enquiry.';
      alert(msg);
    }
  };

  return (
    <div className="page page--public">
      <header className="market-header market-header--simple">
        <Link to="/" className="market-brand">
          <span className="market-brand__gem">Bharat</span>
          <span className="market-brand__im">Bazaar</span>
        </Link>
        <nav className="market-header__nav">
          <Link to="/">Home</Link>
          <Link to="/tenders">Tenders</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>

      <main className="public-main">
        <h1 className="public-title">B2B marketplace</h1>
        <p className="public-subtitle">
          IndiaMART-style catalog — request quotes as a registered buyer. Suppliers can list products from
          the dashboard.
        </p>

        <div className="toolbar">
          <div className="toolbar__search">
            <input
              type="search"
              className="input"
              placeholder="Search products, suppliers, categories"
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
          <input
            className="input"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            className="input"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="panel">Loading products…</div>
        ) : error ? (
          <div className="panel">{error}</div>
        ) : materials.length === 0 ? (
          <div className="panel">No products match your search.</div>
        ) : (
          <section className="grid grid--3">
            {materials.map((mat) => (
              <article key={mat.id} id={mat.id} className="product-card product-card--im">
                <Link
                  to={`/marketplace/product/${encodeURIComponent(mat.id)}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {mat.imageUrl ? (
                  <img
                    src={mat.imageUrl}
                    alt=""
                    style={{
                      width: '100%',
                      maxHeight: 140,
                      objectFit: 'cover',
                      borderRadius: 8,
                      marginBottom: 8
                    }}
                  />
                ) : null}
                  <h3 className="product-card__title" style={{ cursor: 'pointer' }}>
                    {mat.name}
                  </h3>
                  <p className="product-card__meta">
                    {mat.category} · {mat.pack} · MOQ: {mat.moq}
                  </p>
                  <div className="product-card__price">{mat.indicativePrice}</div>
                  <p className="product-card__supplier">Supplier: {mat.supplier}</p>
                  {mat.address ? <p className="product-card__meta">{mat.address}</p> : null}
                  {(mat.city || mat.state) && (
                    <p className="product-card__meta">Available in {mat.city || '—'}, {mat.state || '—'}</p>
                  )}
                </Link>
                <button
                  type="button"
                  className="btn btn--im btn--block"
                  disabled={Boolean(sentFor[mat.id])}
                  onClick={() => requestQuote(mat)}
                >
                  {sentFor[mat.id] ? 'Enquiry sent' : 'Get best price / RFQ'}
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default PublicMarketplace;
