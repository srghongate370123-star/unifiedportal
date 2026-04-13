import React from 'react';
import api from '../../api/client.js';
import axios from '../../api/client.js';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';

function ProductDetail() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const storedUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('up-user') || 'null');
    } catch {
      return null;
    }
  }, []);
  const user = outlet?.user ?? storedUser;
  const isBuyer = outlet?.isBuyer ?? user?.role === 'buyer';

  const [mat, setMat] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [chatMsg, setChatMsg] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`/api/materials/product/${encodeURIComponent(materialId)}`);
        if (!cancelled) setMat(res.data);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'Could not load product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  const startChat = async () => {
    if (!isBuyer) {
      navigate(`/login?next=${encodeURIComponent(`/marketplace/product/${mat.id}`)}`);
      return;
    }
    setChatMsg('');
    try {
      const res = await api.post('/api/messages/open/marketplace', { materialId: mat.id });
      const cid = res.data?.conversationId;
      if (cid) navigate(`/dashboard/messages?c=${encodeURIComponent(cid)}`);
    } catch (e) {
      setChatMsg(e?.response?.data?.message || 'Could not open chat.');
    }
  };

  const requestQuote = async () => {
    if (!isBuyer) {
      navigate(`/login?next=${encodeURIComponent(`/marketplace/product/${mat.id}`)}`);
      return;
    }
    try {
      await api.post('/api/materials/enquiry', { materialId: mat.id, note: '' });
      setChatMsg('RFQ sent to the supplier.');
    } catch (e) {
      setChatMsg(e?.response?.data?.message || 'Could not send RFQ.');
    }
  };

  if (loading) return <div className="panel">Loading product…</div>;
  if (error || !mat) return <div className="panel">{error || 'Not found.'}</div>;

  const inDashboard = Boolean(outlet?.user);

  return (
    <div className={inDashboard ? 'view view--active' : 'page page--public'}>
      {!inDashboard && (
        <header className="market-header market-header--simple">
          <Link to="/" className="market-brand">
            <span className="market-brand__gem">Bharat</span>
            <span className="market-brand__im">Bazaar</span>
          </Link>
          <nav className="market-header__nav">
            <Link to="/marketplace">Catalog</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </header>
      )}

      <section className={inDashboard ? '' : 'public-main'} style={{ maxWidth: 900, margin: '0 auto' }}>
        <header className="content__header">
          <div>
            <h1 className="content__title">{mat.name}</h1>
            <p className="content__subtitle mono">{mat.id}</p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
            Back
          </button>
        </header>

        <div className="panel">
          <div className="grid grid--2" style={{ alignItems: 'start' }}>
            <div>
              {mat.imageUrl ? (
                <img
                  src={mat.imageUrl}
                  alt=""
                  style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12 }}
                />
              ) : (
                <div
                  className="form__hint"
                  style={{
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f0f0',
                    borderRadius: 12
                  }}
                >
                  No photo
                </div>
              )}
            </div>
            <div>
              <p className="form__hint" style={{ marginTop: 0 }}>
                <strong>Category:</strong> {mat.category}
              </p>
              <p className="form__hint">
                <strong>Pack / MOQ:</strong> {mat.pack} · {mat.moq}
              </p>
              <p style={{ fontSize: 22, fontWeight: 600, margin: '12px 0' }}>{mat.indicativePrice}</p>
              <p className="form__hint">
                <strong>Supplier:</strong> {mat.supplier}
              </p>
              {(mat.city || mat.state) && (
                <p className="form__hint">
                  <strong>Region:</strong> {mat.city || '—'}, {mat.state || '—'}
                </p>
              )}
              {mat.address && (
                <p className="form__hint">
                  <strong>Address:</strong> {mat.address}
                </p>
              )}
              {isBuyer && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                  <button type="button" className="btn btn--im" onClick={requestQuote}>
                    Send RFQ
                  </button>
                  <button type="button" className="btn btn--outline" onClick={startChat}>
                    Message supplier
                  </button>
                </div>
              )}
              {!isBuyer && user && (
                <p className="form__hint" style={{ marginTop: 16 }}>
                  Sign in as a buyer to send an RFQ or message the supplier.
                </p>
              )}
              {chatMsg && <p className="form__hint" style={{ marginTop: 12 }}>{chatMsg}</p>}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <h3 className="panel__title" style={{ fontSize: 16 }}>
              Description
            </h3>
            <p className="form__hint" style={{ whiteSpace: 'pre-wrap' }}>
              {mat.description || 'No description provided.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProductDetail;
