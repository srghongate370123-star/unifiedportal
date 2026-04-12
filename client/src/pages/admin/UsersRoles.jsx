import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

function UsersRoles() {
  const [users, setUsers] = React.useState([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api
      .get('/api/admin/users')
      .then((res) => setUsers(res.data || []))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load users.'));
  }, []);

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Users &amp; Roles</h1>
          <p className="content__subtitle">Add users and assign roles (frontend only).</p>
        </div>
        <button className="btn btn--primary">+ Add User</button>
      </header>

      <div className="table-card">
        <div className="table-card__header">
          <div className="table-card__title">Users</div>
          <div className="table-card__meta">Admin view</div>
        </div>
        {error && <p className="form__error" style={{ padding: '0 12px' }}>{error}</p>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Location</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/dashboard/admin/user/${encodeURIComponent(u.id)}`}>{u.name}</Link>
                  </td>
                  <td className="mono">{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className="status status--info">Active</span>
                  </td>
                  <td>
                    {u.city || '—'}, {u.state || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link className="btn btn--outline btn--sm" to={`/dashboard/admin/user/${encodeURIComponent(u.id)}`}>
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default UsersRoles;

