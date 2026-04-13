import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell.jsx';

function DashboardLayout({ user, onLogout }) {
  const isBuyer = user.role === 'buyer';
  const isAdmin = user.role === 'admin';
  const isSupplier = user.role === 'supplier' || user.role === 'seller';
  const location = useLocation();
  const navigate = useNavigate();

  const inTendering = location.pathname.includes('/dashboard/tendering');
  const inMaterials = location.pathname.includes('/dashboard/materials');
  const activeTop = inMaterials ? 'materials' : 'tendering';

  const toTendering = () => navigate('/dashboard/tendering');
  const toMaterials = () => navigate('/dashboard/materials/catalog');

  return (
    <div className="page page--dashboard">
      <header className="topbar topbar--market">
        <div className="topbar__left">
          <button
            type="button"
            className="brand brand--compact brand--link"
            onClick={() => navigate('/')}
          >
            <div className="brand__logo brand__logo--gem">B</div>
            <div className="brand__text">
              <span className="brand__title">Bharat Bazaar</span>
              <span className="brand__subtitle">
                {isBuyer ? 'Buyer workspace' : 'Supplier workspace'}
              </span>
            </div>
          </button>
        </div>

        <div className="topbar__center">
          <div className="topbar__tabs">
            <button
              type="button"
              className={`topbar-tab ${activeTop === 'tendering' ? 'topbar-tab--active' : ''}`}
              onClick={toTendering}
            >
              Tendering
            </button>
            <button
              type="button"
              className={`topbar-tab ${activeTop === 'materials' ? 'topbar-tab--active' : ''}`}
              onClick={toMaterials}
            >
              Marketplace
            </button>
          </div>
        </div>

        <div className="topbar__right">
          <div className="avatar">
            <span className="avatar__circle">
              {(user.name || 'User')
                .split(' ')
                .map((p) => p[0] || '')
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div className="avatar__meta">
              <span className="avatar__name">{user.name || 'User'}</span>
              <span className="avatar__role">
                {isAdmin ? 'Admin' : isBuyer ? 'Buyer / Department' : 'Supplier'}
              </span>
            </div>
          </div>
          <NotificationBell />
          <button type="button" className="btn btn--ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="shell">
        <nav className="sidebar">
          <div className="sidebar__group">
            <span className="sidebar__label">Tendering</span>
            <NavLink to="/dashboard/tendering" className="sidebar__item">
              Dashboard
            </NavLink>
            {isBuyer && (
              <NavLink to="/dashboard/tendering/new" className="sidebar__item">
                New tender
              </NavLink>
            )}
            <NavLink to="/dashboard/tendering/discover" className="sidebar__item">
              Discover tenders
            </NavLink>
            <NavLink to="/dashboard/tendering/my-tenders" className="sidebar__item">
              My tenders
            </NavLink>
            {isSupplier && (
              <NavLink to="/dashboard/tendering/my-bids" className="sidebar__item">
                My bids
              </NavLink>
            )}
          </div>

          <div className="sidebar__group">
            <span className="sidebar__label">Messages</span>
            <NavLink to="/dashboard/messages" className="sidebar__item">
              Direct messages
            </NavLink>
            <NavLink to="/dashboard/profile" className="sidebar__item">
              My profile
            </NavLink>
          </div>

          <div className="sidebar__group">
            <span className="sidebar__label">Marketplace</span>
            <NavLink to="/dashboard/materials/catalog" className="sidebar__item">
              Product catalog
            </NavLink>
            {!isBuyer && (
              <>
                <NavLink to="/dashboard/materials/add" className="sidebar__item">
                  List product
                </NavLink>
                <NavLink to="/dashboard/materials/incoming" className="sidebar__item">
                  Incoming RFQs
                </NavLink>
              </>
            )}
            {isBuyer && (
              <NavLink to="/dashboard/materials/enquiries" className="sidebar__item">
                My RFQs
              </NavLink>
            )}
          </div>

          {isAdmin && (
            <div className="sidebar__group">
              <span className="sidebar__label">Admin</span>
              <NavLink to="/dashboard/admin/users-roles" className="sidebar__item">
                Users
              </NavLink>
              <NavLink to="/dashboard/admin/audit-logs" className="sidebar__item">
                Tender approvals
              </NavLink>
              <NavLink to="/dashboard/admin/materials" className="sidebar__item">
                Product approvals
              </NavLink>
            </div>
          )}

          <div className="sidebar__group">
            <span className="sidebar__label">Public site</span>
            <NavLink to="/" className="sidebar__item">
              Home
            </NavLink>
            <NavLink to="/tenders" className="sidebar__item">
              Live tenders
            </NavLink>
            <NavLink to="/marketplace" className="sidebar__item">
              Marketplace (public)
            </NavLink>
          </div>
        </nav>

        <main className="content">
          <Outlet context={{ user, isBuyer, isAdmin }} />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
