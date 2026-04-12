import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', {
        identifier,
        password
      });
      onLogin(res.data);
      const next = searchParams.get('next');
      navigate(next && next.startsWith('/') ? next : '/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Unable to sign in. Check email and password, and ensure MongoDB is running with MONGODB_URI set.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--auth page--market">
      <div className="market-header market-header--simple">
        <Link to="/" className="market-brand">
          <span className="market-brand__gem">Bharat</span>
          <span className="market-brand__im">Bazaar</span>
        </Link>
        <nav className="market-header__nav">
          <Link to="/tenders">Tenders</Link>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/register">Register</Link>
        </nav>
      </div>

      <div className="auth-panel-wrap">
        <main className="auth-panel" aria-labelledby="login-heading">
          <div className="auth-panel__inner">
            <header className="auth-minihead">
              <div className="brand brand--compact">
                <div className="brand__logo brand__logo--gem">B</div>
                <div className="brand__text">
                  <span className="brand__title">Sign in</span>
                  <span className="brand__subtitle">Buyers &amp; suppliers</span>
                </div>
              </div>
              <div>
                <h1 id="login-heading" className="auth-panel__title">
                  Welcome back
                </h1>
                <p className="auth-panel__subtitle">
                  Use the email and password you registered with. New user?{' '}
                  <Link to="/register">Create an account</Link>.
                </p>
              </div>
            </header>

            <form className="form" onSubmit={handleSubmit}>
              <div className="form__field">
                <label htmlFor="identifier" className="form__label">
                  Email
                </label>
                <input
                  id="identifier"
                  type="email"
                  className="input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@organization.gov.in"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="form__field">
                <label htmlFor="password" className="form__label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="form__error">{error}</p>}

              <div className="form__meta">
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--block btn--cta"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Continue'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
