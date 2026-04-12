import React from 'react';
import api from '../../api/client.js';
import { Link, useNavigate, useParams } from 'react-router-dom';

function AdminUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api
      .get(`/api/admin/users/${encodeURIComponent(userId)}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load profile.'));
  }, [userId]);

  if (error) {
    return (
      <section className="view view--active">
        <header className="content__header">
          <div>
            <h1 className="content__title">User profile</h1>
          </div>
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
            Back
          </button>
        </header>
        <div className="panel">{error}</div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="view view--active">
        <div className="panel">Loading…</div>
      </section>
    );
  }

  const { user, tenders, materials } = data;

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">{user.name}</h1>
          <p className="content__subtitle">
            {user.role} · {user.email}
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      <div className="panel" style={{ marginBottom: 16 }}>
        <p className="form__hint" style={{ marginTop: 0 }}>
          <strong>Organization:</strong> {user.organization || '—'}
          <br />
          <strong>Phone:</strong> {user.phone || '—'}
          <br />
          <strong>Location:</strong> {user.city || '—'}, {user.state || '—'}
        </p>
      </div>

      <div className="table-card" style={{ marginBottom: 16 }}>
        <div className="table-card__header">
          <div className="table-card__title">Tenders ({tenders.length})</div>
        </div>
        <div className="table-wrap">
          {tenders.length === 0 ? (
            <p className="form__hint" style={{ padding: 12 }}>
              No tenders created.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Bids</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.status}</td>
                    <td>{t.bids}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        className="btn btn--ghost btn--sm"
                        to={`/dashboard/admin/tender/${encodeURIComponent(t.id)}/bids`}
                      >
                        Bids
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <div className="table-card__title">Marketplace listings ({materials.length})</div>
        </div>
        <div className="table-wrap">
          {materials.length === 0 ? (
            <p className="form__hint" style={{ padding: 12 }}>
              No product listings.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="mono">{m.id}</td>
                    <td>{m.name}</td>
                    <td>{m.category}</td>
                    <td>{m.indicativePrice}</td>
                    <td>{m.approvalStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminUserProfile;
