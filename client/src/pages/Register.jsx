import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [role, setRole] = React.useState('buyer');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [organization, setOrganization] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/register', {
        email,
        password,
        name,
        organization,
        phone,
        city,
        state,
        role
      });
      localStorage.setItem('up-token', res.data.token);
      localStorage.setItem('up-user', JSON.stringify(res.data.user));
      onLogin(res.data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Registration failed. Ensure MongoDB is running and MONGODB_URI is set on the server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--auth page--market">
      <div className="market-header market-header--simple">
        <Link to="/" className="market-brand">
          <span className="market-brand__gem">GeM</span>
          <span className="market-brand__sep">+</span>
          <span className="market-brand__im">IndiaMART</span>
          <span className="market-brand__tag">style B2B portal</span>
        </Link>
        <nav className="market-header__nav">
          <Link to="/tenders">Tenders</Link>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </div>

      <div className="auth-panel-wrap">
        <div className="auth-panel__inner auth-panel__inner--wide">
          <header className="auth-minihead">
            <h1 className="auth-panel__title">Create your account</h1>
            <p className="auth-panel__subtitle">
              Buyers publish tenders; suppliers list products and submit bids.
            </p>
          </header>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form__field">
              <label className="form__label">Account type</label>
              <div className="segmented-control">
                <input
                  type="radio"
                  id="reg-buyer"
                  name="role"
                  value="buyer"
                  checked={role === 'buyer'}
                  onChange={() => setRole('buyer')}
                />
                <label htmlFor="reg-buyer">Buyer / Department</label>
                <input
                  type="radio"
                  id="reg-seller"
                  name="role"
                  value="supplier"
                  checked={role === 'supplier'}
                  onChange={() => setRole('supplier')}
                />
                <label htmlFor="reg-seller">Supplier / Seller</label>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form__field">
                <label className="form__label" htmlFor="reg-name">
                  Full name
                </label>
                <input
                  id="reg-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form__field">
                <label className="form__label" htmlFor="reg-org">
                  Organization
                </label>
                <input
                  id="reg-org"
                  className="input"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Company or department name"
                />
              </div>
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="reg-email">
                Work email
              </label>
              <input
                id="reg-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-grid-2">
              <div className="form__field">
                <label className="form__label" htmlFor="reg-phone">
                  Phone (optional)
                </label>
                <input
                  id="reg-phone"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 ..."
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
                <label className="form__label" htmlFor="reg-pass">
                  Password (min 8 characters)
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && <p className="form__error">{error}</p>}

            <button
              type="submit"
              className="btn btn--primary btn--block btn--cta"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Register'}
            </button>

            <p className="form__hint" style={{ textAlign: 'center', marginTop: 14 }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
