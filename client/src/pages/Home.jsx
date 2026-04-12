import React from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'Infrastructure',
  'Technology',
  'Civil & Construction',
  'Electrical',
  'Logistics',
  'Plumbing',
  'Painting'
];

function Home() {
  const loginTenders = `/login?next=${encodeURIComponent('/tenders')}`;
  const loginMarketplace = `/login?next=${encodeURIComponent('/marketplace')}`;

  return (
    <div className="page page--home">
      <header className="market-header">
        <div className="market-header__row">
          <Link to="/" className="market-brand">
            <span className="market-brand__gem">Bharat</span>
            <span className="market-brand__im">Bazaar</span>
            <span className="market-brand__tag">Tenders · B2B Marketplace</span>
          </Link>
          <div className="market-search">
            <input
              type="search"
              className="market-search__input"
              placeholder="Sign in to search tenders and the marketplace"
              readOnly
              aria-readonly="true"
            />
            <Link to={loginMarketplace} className="btn btn--im">
              Sign in to search
            </Link>
          </div>
          <nav className="market-header__nav">
            <Link to={loginTenders}>Live tenders</Link>
            <Link to={loginMarketplace}>Marketplace</Link>
            <Link to="/login" className="btn btn--outline btn--sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn--primary btn--sm">
              Register
            </Link>
          </nav>
        </div>
        <div className="market-categories">
          {CATEGORIES.map((c) => (
            <Link key={c} to={loginTenders} className="market-chip" title="Sign in to browse by category">
              {c}
            </Link>
          ))}
        </div>
      </header>

      <section className="hero-split">
        <div className="hero-split__gem">
          <p className="hero-eyebrow">Government & enterprise procurement</p>
          <h1>Publish tenders. Receive bids. Award transparently.</h1>
          <p className="hero-lead">
            A GeM-inspired workflow for publishing opportunities, tracking bid counts, and managing your
            procurement pipeline in one place.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn--gem btn--lg">
              Register as buyer
            </Link>
            <Link to={loginTenders} className="btn btn--ghost-light btn--lg">
              Browse tenders (sign in)
            </Link>
          </div>
          <ul className="hero-stats">
            <li>
              <strong>Sign in</strong> to view live listings
            </li>
            <li></li>
            <li></li>
          </ul>
        </div>
        <div className="hero-split__im">
          <p className="hero-eyebrow hero-eyebrow--dark">Marketplace</p>
          <h2>Source materials &amp; industrial supplies</h2>
          <p className="hero-lead hero-lead--dark">
            List your catalog as a supplier, or send RFQs to verified product listings as a buyer — after you
            sign in.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn--im btn--lg">
              List as supplier
            </Link>
            <Link to={loginMarketplace} className="btn btn--outline-dark btn--lg">
              Explore products (sign in)
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <h2>Featured tenders</h2>
          <Link to={loginTenders} className="link">
            View all (sign in)
          </Link>
        </div>
        <div className="panel" style={{ marginTop: 8 }}>
          <p className="form__hint" style={{ margin: 0 }}>
            Tender listings are available after you <Link to="/login">sign in</Link> or{' '}
            <Link to="/register">register</Link>. Buyers create and award tenders; suppliers discover opportunities
            and submit bids.
          </p>
        </div>
      </section>

      <section className="home-section home-section--alt">
        <div className="home-section__head">
          <h2>Popular product categories</h2>
          <Link to={loginMarketplace} className="link link--dark">
            Full catalog (sign in)
          </Link>
        </div>
        <div className="panel" style={{ marginTop: 8 }}>
          <p className="form__hint" style={{ margin: 0 }}>
            The B2B marketplace catalog opens once you are signed in. Suppliers list products; buyers send RFQs
            with their contact details to the supplier by email.
          </p>
        </div>
      </section>

      <footer className="market-footer">
        <p>Bharat Bazaar — unified tendering and marketplace.</p>
      </footer>
    </div>
  );
}

export default Home;
