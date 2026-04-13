import React from 'react';
import api from '../../api/client.js';
import axios from '../../api/client.js';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';

function MaterialCatalog() {
  const { user, isBuyer } = useOutletContext();
  const navigate = useNavigate();
  const [materials, setMaterials] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const [sentFor, setSentFor] = React.useState({});
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
        const qs = params.toString();
        const res = await axios.get(qs ? `/api/materials?${qs}` : '/api/materials');
        if (!cancelled) setMaterials(res.data || []);
      } catch {
        if (!cancelled) setError('Failed to load materials from the server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, category]);

  const categories = React.useMemo(() => {
    const set = new Set(materials.map((m) => m.category));
    return ['All', ...Array.from(set)];
  }, [materials]);

  const requestQuote = async (mat) => {
    if (!isBuyer) {
      navigate('/dashboard/tendering');
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
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Product catalog</h1>
          <p className="content__subtitle">
            IndiaMART-style listings — request a best price as a buyer. Suppliers can add listings from the
            sidebar.
          </p>
        </div>
        {!isBuyer && (
          <button
            type="button"
            className="btn btn--im"
            onClick={() => navigate('/dashboard/materials/add')}
          >
            + List product
          </button>
        )}
      </header>

      <div className="toolbar">
        <div className="toolbar__search">
          <input
            type="search"
            className="input"
            placeholder="Search products or suppliers"
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
      </div>

      {loading ? (
        <div className="panel">Loading materials…</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : materials.length === 0 ? (
        <div className="panel">No materials match your search.</div>
      ) : (
        <section className="grid grid--3">
          {materials.map((mat) => (
            <article key={mat.id} className="product-card product-card--im">
              <Link
                to={`/dashboard/materials/product/${encodeURIComponent(mat.id)}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
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
                <div className="product-card__price">{mat.indicativePrice} (indicative)</div>
                <p className="product-card__supplier">Supplier: {mat.supplier}</p>
                {mat.address ? <p className="product-card__meta">{mat.address}</p> : null}
                {(mat.city || mat.state) && (
                  <p className="product-card__meta">
                    {mat.city || '—'}, {mat.state || '—'}
                  </p>
                )}
              </Link>
              {isBuyer ? (
                <button
                  type="button"
                  className="btn btn--im btn--block"
                  disabled={Boolean(sentFor[mat.id])}
                  onClick={() => requestQuote(mat)}
                >
                  {sentFor[mat.id] ? 'Enquiry sent' : 'Get best price / RFQ'}
                </button>
              ) : (
                <p className="form__hint" style={{ marginTop: 8 }}>
                  Buyer accounts can send RFQs. You are signed in as a supplier ({user?.name}).
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

export default MaterialCatalog;
