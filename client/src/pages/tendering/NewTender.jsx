import React from 'react';
import api from '../../api/client.js';
import { useNavigate, useOutletContext } from 'react-router-dom';

function NewTender() {
  const { isBuyer, user } = useOutletContext();
  const navigate = useNavigate();

  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('Infrastructure');
  const [customCategory, setCustomCategory] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const [estimatedValue, setEstimatedValue] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [specificationDocumentUrl, setSpecificationDocumentUrl] = React.useState('');
  const [err, setErr] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      setErr('Please enter a custom category.');
      return;
    }
    try {
      await api.post('/api/tenders', {
        title,
        category: finalCategory,
        department,
        location,
        city,
        state,
        deadline,
        estimatedValue,
        summary,
        specificationDocumentUrl
      });
      navigate('/dashboard/tendering/my-tenders', { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Could not save tender. Are you signed in as a buyer?');
    }
  };

  if (!isBuyer) {
    return (
      <section className="view view--active">
        <header className="content__header">
          <div>
            <h1 className="content__title">New tender</h1>
            <p className="content__subtitle">Only buyer accounts can create tenders.</p>
          </div>
        </header>
        <div className="panel">
          <p className="content__subtitle" style={{ margin: 0 }}>
            Register or sign in with a <strong>buyer</strong> account, or use the public site to browse
            opportunities.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">New tender</h1>
          <p className="content__subtitle">
            Saved as draft under <strong>{user?.organization || user?.name}</strong>. Publish from the
            tender detail page when ready.
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      <div className="panel">
        {err && <p className="form__error">{err}</p>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid--3">
            <div className="form__field">
              <label className="form__label">Tender title</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Smart City Road Construction"
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
                <option>Infrastructure</option>
                <option>Technology</option>
                <option>Logistics</option>
                <option>Civil & Construction</option>
                <option>Electrical</option>
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
              <label className="form__label">Department / buyer unit</label>
              <input
                className="input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., PWD / IT cell"
              />
            </div>

            <div className="form__field">
              <label className="form__label">Location</label>
              <input
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="State / city"
              />
            </div>

            <div className="form__field">
              <label className="form__label">Submission deadline</label>
              <input
                type="date"
                className="input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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

            <div className="form__field">
              <label className="form__label">Estimated value (optional)</label>
              <input
                className="input"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="e.g., ₹2.4 Cr – ₹5.0 Cr"
              />
            </div>
          </div>

          <div className="form__field" style={{ marginTop: 12 }}>
            <label className="form__label">Tender summary</label>
            <textarea
              className="input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Scope, eligibility, EMD, document upload instructions…"
              rows={5}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form__field" style={{ marginTop: 12 }}>
            <label className="form__label">Specification / BoQ PDF or document URL (optional)</label>
            <input
              className="input"
              value={specificationDocumentUrl}
              onChange={(e) => setSpecificationDocumentUrl(e.target.value)}
              placeholder="https://… (link to PDF or shared folder)"
            />
            <p className="form__hint">Host the file on Drive, Dropbox, or your server and paste the link.</p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--outline" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--gem">
              Save draft
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default NewTender;
