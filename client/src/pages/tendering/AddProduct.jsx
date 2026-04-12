import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../api/client.js';

function AddProduct() {
  const { isBuyer, user } = useOutletContext();
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('Civil & Construction');
  const [customCategory, setCustomCategory] = React.useState('');
  const [pack, setPack] = React.useState('Unit');
  const [moq, setMoq] = React.useState('1');
  const [indicativePrice, setIndicativePrice] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [err, setErr] = React.useState('');

  if (isBuyer) {
    return (
      <section className="view view--active">
        <header className="content__header">
          <div>
            <h1 className="content__title">List a product</h1>
            <p className="content__subtitle">Only supplier accounts can create listings.</p>
          </div>
        </header>
        <div className="panel">
          <p className="content__subtitle" style={{ margin: 0 }}>
            Register or sign in with a supplier account to list products.
          </p>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      setErr('Please enter a custom category.');
      return;
    }
    try {
      const res = await api.post('/api/materials', {
        name,
        category: finalCategory,
        pack,
        moq,
        indicativePrice: indicativePrice || 'On request',
        city,
        state,
        address,
        imageUrl,
        description
      });
      setMsg(res.data?.message || 'Listed.');
      setName('');
      setDescription('');
      navigate('/dashboard/materials/catalog', { replace: false });
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Could not create listing.');
    }
  };

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">List a product</h1>
          <p className="content__subtitle">
            Your organization ({user?.organization || user?.name}) appears as the supplier name.
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <div className="grid grid--3">
            <div className="form__field">
              <label className="form__label">Product name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form__field">
              <label className="form__label">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'Other') setCustomCategory('');
                }}
              >
                <option>Civil & Construction</option>
                <option>Electrical</option>
                <option>Plumbing</option>
                <option>Painting</option>
                <option>Technology</option>
                <option>Logistics</option>
                <option>General</option>
                <option>Other</option>
              </select>
            </div>
            {category === 'Other' && (
              <div className="form__field">
                <label className="form__label">Custom category</label>
                <input
                  className="input"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category"
                  required
                />
              </div>
            )}
            <div className="form__field">
              <label className="form__label">Pack / unit</label>
              <input className="input" value={pack} onChange={(e) => setPack(e.target.value)} />
            </div>
            <div className="form__field">
              <label className="form__label">MOQ</label>
              <input className="input" value={moq} onChange={(e) => setMoq(e.target.value)} />
            </div>
            <div className="form__field">
              <label className="form__label">Indicative price</label>
              <input
                className="input"
                value={indicativePrice}
                onChange={(e) => setIndicativePrice(e.target.value)}
                placeholder="e.g. ₹1,200 / unit"
              />
            </div>
            <div className="form__field">
              <label className="form__label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="form__field">
              <label className="form__label">State</label>
              <input className="input" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="form__field" style={{ gridColumn: '1 / -1' }}>
              <label className="form__label">Supplier address (optional)</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, area, PIN — shown to buyers"
              />
            </div>
            <div className="form__field" style={{ gridColumn: '1 / -1' }}>
              <label className="form__label">Product image URL (optional)</label>
              <input
                className="input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="form__field" style={{ marginTop: 12 }}>
            <label className="form__label">Description</label>
            <textarea
              className="input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {err && <p className="form__error">{err}</p>}
          {msg && <p className="form__hint" style={{ color: 'var(--accent-green)' }}>{msg}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="submit" className="btn btn--im">
              Publish listing
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AddProduct;
