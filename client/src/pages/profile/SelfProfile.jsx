import React from 'react';
import api from '../../api/client.js';
import { useOutletContext } from 'react-router-dom';

function SelfProfile() {
  const { user: outletUser } = useOutletContext();
  const [user, setUser] = React.useState(outletUser);
  const [name, setName] = React.useState(outletUser?.name || '');
  const [organization, setOrganization] = React.useState(outletUser?.organization || '');
  const [phone, setPhone] = React.useState(outletUser?.phone || '');
  const [city, setCity] = React.useState(outletUser?.city || '');
  const [state, setState] = React.useState(outletUser?.state || '');
  const [msg, setMsg] = React.useState('');
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api
      .get('/api/auth/me')
      .then((res) => {
        const u = res.data?.user;
        if (u) {
          setUser(u);
          setName(u.name || '');
          setOrganization(u.organization || '');
          setPhone(u.phone || '');
          setCity(u.city || '');
          setState(u.state || '');
        }
      })
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const res = await api.patch('/api/auth/me', {
        name,
        organization,
        phone,
        city,
        state
      });
      const u = res.data?.user;
      if (u) {
        setUser(u);
        localStorage.setItem('up-user', JSON.stringify(u));
        setMsg('Profile saved. Refreshing…');
        setTimeout(() => window.location.reload(), 600);
      }
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Could not save.');
    }
  };

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">My profile</h1>
          <p className="content__subtitle">View and update your account details.</p>
        </div>
      </header>

      <div className="panel" style={{ maxWidth: 560 }}>
        <div className="form__field">
          <span className="form__label">Email</span>
          <div className="mono">{user?.email}</div>
          <p className="form__hint">Email cannot be changed here.</p>
        </div>
        <div className="form__field">
          <span className="form__label">Role</span>
          <div>{user?.role}</div>
        </div>

        <form onSubmit={save}>
          <div className="form__field">
            <label className="form__label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form__field">
            <label className="form__label">Organization</label>
            <input className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          </div>
          <div className="form__field">
            <label className="form__label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid--2">
            <div className="form__field">
              <label className="form__label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="form__field">
              <label className="form__label">State</label>
              <input className="input" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>
          {err && <p className="form__error">{err}</p>}
          {msg && <p className="form__hint" style={{ color: 'var(--accent-green)' }}>{msg}</p>}
          <button type="submit" className="btn btn--gem" style={{ marginTop: 12 }}>
            Save changes
          </button>
        </form>
      </div>
    </section>
  );
}

export default SelfProfile;
