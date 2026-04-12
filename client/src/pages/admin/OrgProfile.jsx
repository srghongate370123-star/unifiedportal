import React from 'react';
import { useOutletContext } from 'react-router-dom';

function OrgProfile() {
  const { user } = useOutletContext();

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Organization Profile</h1>
          <p className="content__subtitle">Basic organization details (frontend only).</p>
        </div>
        <button className="btn btn--primary">Save</button>
      </header>

      <div className="grid grid--3">
        <div className="stat-card">
          <div className="stat-card__label">Organization</div>
          <div className="stat-card__value" style={{ fontSize: 16, marginTop: 8 }}>
            {user.organization || '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Primary Admin</div>
          <div className="stat-card__value" style={{ fontSize: 16, marginTop: 8 }}>
            {user.name}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Status</div>
          <div className="stat-card__value" style={{ fontSize: 16, marginTop: 8 }}>
            Verified
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel__header">
          <h2 className="panel__title">Details</h2>
        </div>
        <div className="form__field">
          <label className="form__label">Registered Address</label>
          <input className="input" placeholder="Address line 1, city, state, pincode" />
        </div>
        <div className="form__field">
          <label className="form__label">GST / Tax ID</label>
          <input className="input" placeholder="GSTIN / Tax ID" />
        </div>
      </div>
    </section>
  );
}

export default OrgProfile;

