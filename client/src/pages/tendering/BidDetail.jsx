import React from 'react';
import api from '../../api/client.js';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';

function BidDetail() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/bids/${encodeURIComponent(bidId)}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load bid.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [bidId]);

  const inDashboard = Boolean(outlet?.user);
  const tenderPath = data?.tender?.id
    ? `/dashboard/tendering/tender/${encodeURIComponent(data.tender.id)}`
    : null;

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Bid details</h1>
          <p className="content__subtitle">{bidId}</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>

      {loading && <div className="panel">Loading…</div>}
      {error && <div className="panel">{error}</div>}
      {data && !loading && (
        <div className="panel">
          <p className="form__hint" style={{ marginTop: 0 }}>
            <strong>Tender:</strong>{' '}
            {tenderPath && inDashboard ? (
              <Link to={tenderPath}>{data.tender?.title || data.tender?.id}</Link>
            ) : (
              data.tender?.title || data.tender?.id
            )}
            {data.tender?.status && (
              <>
                {' '}
                · <span className="status status--info">{data.tender.status}</span>
              </>
            )}
          </p>
          <div className="grid grid--2" style={{ marginTop: 16 }}>
            <div className="form__field">
              <span className="form__label">Quoted amount</span>
              <div>{data.bid.bidAmount || '—'}</div>
            </div>
            <div className="form__field">
              <span className="form__label">Status</span>
              <div>
                <span className="status status--info">{data.bid.status}</span>
              </div>
            </div>
            <div className="form__field">
              <span className="form__label">Supplier / bidder</span>
              <div>{data.bid.bidderName}</div>
              {data.bid.bidderOrganization && (
                <div className="form__hint">{data.bid.bidderOrganization}</div>
              )}
            </div>
            <div className="form__field">
              <span className="form__label">Contact email</span>
              <div className="mono">{data.bid.email || '—'}</div>
            </div>
            <div className="form__field" style={{ gridColumn: '1 / -1' }}>
              <span className="form__label">Note</span>
              <div>{data.bid.note || '—'}</div>
            </div>
            {data.bid.document && (
              <div className="form__field" style={{ gridColumn: '1 / -1' }}>
                <span className="form__label">Document</span>
                <div>
                  <a href={data.bid.document} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                </div>
              </div>
            )}
            {data.bid.winnerReason && (
              <div className="form__field" style={{ gridColumn: '1 / -1' }}>
                <span className="form__label">Decision note</span>
                <div>{data.bid.winnerReason}</div>
              </div>
            )}
            <div className="form__field">
              <span className="form__label">Submitted</span>
              <div>
                {data.bid.submittedAt ? new Date(data.bid.submittedAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default BidDetail;
