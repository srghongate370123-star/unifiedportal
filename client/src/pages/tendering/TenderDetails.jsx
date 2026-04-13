import React from 'react';
import api from '../../api/client.js';
import axios from '../../api/client.js';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';

const tenderClosed = (t) =>
  t && (t.status === 'Closed' || t.closesIn === 'Closed' || t.status === 'Evaluation');

function TenderDetails() {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const outletUser = outlet?.user;
  const outletIsBuyer = outlet?.isBuyer;

  const storedUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('up-user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const user = outletUser ?? storedUser;
  const isBuyer = outletIsBuyer ?? user?.role === 'buyer';
  const isSeller = user?.role === 'supplier' || user?.role === 'seller';

  const [tender, setTender] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [bidAmount, setBidAmount] = React.useState('');
  const [bidNote, setBidNote] = React.useState('');
  const [bidEmail, setBidEmail] = React.useState(user?.email || '');
  const [bidDocument, setBidDocument] = React.useState('');
  const [bidMsg, setBidMsg] = React.useState('');
  const [bidErr, setBidErr] = React.useState('');
  const [bids, setBids] = React.useState([]);
  const [bidsLoading, setBidsLoading] = React.useState(false);
  const [publishMsg, setPublishMsg] = React.useState('');
  const [analytics, setAnalytics] = React.useState(null);
  const [winnerReason, setWinnerReason] = React.useState('');
  const [hasMyBid, setHasMyBid] = React.useState(false);
  const [tenderChatErr, setTenderChatErr] = React.useState('');

  const inDashboard = Boolean(outletUser);

  React.useEffect(() => {
    if (inDashboard) return;
    const token = localStorage.getItem('up-token');
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(`/tenders/${tenderId}`)}`, { replace: true });
    }
  }, [inDashboard, navigate, tenderId]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    axios
      .get(`/api/tenders/${encodeURIComponent(tenderId)}`)
      .then((res) => {
        if (!cancelled) setTender(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load tender.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenderId]);

  const loadBids = React.useCallback(async () => {
    if (!tender?.id || !user?.id || !isBuyer) return;
    if (tender.createdBy !== user.id) return;
    setBidsLoading(true);
    try {
      const res = await api.get(`/api/tenders/${encodeURIComponent(tender.id)}/bids`);
      setBids(res.data || []);
    } catch {
      setBids([]);
    } finally {
      setBidsLoading(false);
    }
  }, [tender?.id, tender?.createdBy, user?.id, isBuyer]);

  React.useEffect(() => {
    loadBids();
  }, [loadBids]);

  React.useEffect(() => {
    if (!isSeller || !tenderId) {
      setHasMyBid(false);
      return;
    }
    let cancelled = false;
    api
      .get('/api/my-bids')
      .then((r) => {
        if (!cancelled) setHasMyBid((r.data || []).some((b) => b.tenderId === tenderId));
      })
      .catch(() => {
        if (!cancelled) setHasMyBid(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSeller, tenderId, tender?.bids]);

  React.useEffect(() => {
    if (!tender?.id || !user?.id) return;
    api
      .get(`/api/tenders/${encodeURIComponent(tender.id)}/analytics`)
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(null));
  }, [tender?.id, user?.id]);

  const submitBid = async (e) => {
    e.preventDefault();
    setBidMsg('');
    setBidErr('');
    const token = localStorage.getItem('up-token');
    if (!token || !isSeller) {
      navigate(`/login?next=${encodeURIComponent(`/tenders/${tenderId}`)}`);
      return;
    }
    try {
      await api.post(`/api/tenders/${encodeURIComponent(tenderId)}/bids`, {
        quotedAmount: bidAmount,
        note: bidNote,
        email: bidEmail,
        document: bidDocument
      });
      setBidMsg('Bid submitted successfully. Email notification sent to buyer.');
      setBidAmount('');
      setBidNote('');
      setBidDocument('');
      const res = await axios.get(`/api/tenders/${encodeURIComponent(tenderId)}`);
      setTender(res.data);
      setHasMyBid(true);
    } catch (err) {
      setBidErr(err?.response?.data?.message || 'Could not submit bid.');
    }
  };

  const publishTender = async () => {
    setPublishMsg('');
    try {
      await api.patch(`/api/tenders/${encodeURIComponent(tenderId)}/publish`);
      setPublishMsg('Tender is now published for suppliers.');
      const res = await axios.get(`/api/tenders/${encodeURIComponent(tenderId)}`);
      setTender(res.data);
    } catch (err) {
      setPublishMsg(err?.response?.data?.message || 'Could not publish.');
    }
  };

  const goBack = () => {
    if (inDashboard) navigate(-1);
    else navigate('/tenders');
  };

  const isOwner = tender && user?.id && tender.createdBy === user.id;
  const biddingOpen =
    tender && tender.status === 'Published' && tender.closesIn !== 'Closed' && !tenderClosed(tender);

  const openTenderChat = async (withUserId) => {
    setTenderChatErr('');
    const tid = tender?.id || tenderId;
    if (!tid || !withUserId) return;
    try {
      const res = await api.post('/api/messages/open/tender', { tenderId: tid, withUserId });
      const cid = res.data?.conversationId;
      if (cid) navigate(`/dashboard/messages?c=${encodeURIComponent(cid)}`);
    } catch (e) {
      setTenderChatErr(e?.response?.data?.message || 'Could not open chat.');
    }
  };

  const chooseWinner = async (bidId, status) => {
    try {
      await api.patch(`/api/bids/${encodeURIComponent(bidId)}/status`, {
        status,
        reason: winnerReason
      });
      setBidMsg(`Winner update sent via email: ${status}.`);
      loadBids();
      const res = await axios.get(`/api/tenders/${encodeURIComponent(tenderId)}`);
      setTender(res.data);
    } catch (err) {
      setBidErr(err?.response?.data?.message || 'Could not update winner.');
    }
  };

  return (
    <section className={`view view--active ${inDashboard ? '' : 'view--public-tender'}`}>
      {!inDashboard && (
        <header className="market-header market-header--simple">
          <Link to="/" className="market-brand">
            <span className="market-brand__gem">Bharat</span>
            <span className="market-brand__im">Bazaar</span>
          </Link>
          <nav className="market-header__nav">
            <Link to="/tenders">All tenders</Link>
            <Link to="/login">Sign in</Link>
          </nav>
        </header>
      )}

      <header className="content__header">
        <div>
          <h1 className="content__title">Tender details</h1>
          <p className="content__subtitle">
            {loading ? 'Loading…' : tender?.id ? `ID: ${tender.id}` : ''}
          </p>
        </div>
        <button className="btn btn--ghost" onClick={goBack} type="button">
          Back
        </button>
      </header>

      {loading && <div className="panel">Loading tender…</div>}
      {error && <div className="panel">{error}</div>}

      {tender && (
        <>
          <div className="grid grid--3">
            <div className="stat-card">
              <div className="stat-card__label">Title</div>
              <div className="stat-card__value" style={{ fontSize: 16 }}>
                {tender.title}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Category</div>
              <div className="stat-card__value" style={{ fontSize: 16 }}>
                {tender.category}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Status</div>
              <div className="stat-card__value" style={{ fontSize: 16 }}>
                {tender.status}
              </div>
            </div>
          </div>

          <div className="split">
            <div className="panel">
              <div className="panel__header">
                <h2 className="panel__title">Scope summary</h2>
              </div>
              <p className="form__hint" style={{ marginTop: 0, fontSize: 13 }}>
                {tender.summary || '—'}
              </p>
              {(tender.department || tender.location) && (
                <p className="form__hint" style={{ marginTop: 12 }}>
                  {tender.department && (
                    <>
                      <strong>Department:</strong> {tender.department}
                      <br />
                    </>
                  )}
                  {tender.location && (
                    <>
                      <strong>Location:</strong> {tender.location}
                    </>
                  )}
                </p>
              )}
              {tender.specificationDocumentUrl && (
                <p className="form__hint" style={{ marginTop: 12 }}>
                  <strong>Specification / documents:</strong>{' '}
                  <a href={tender.specificationDocumentUrl} target="_blank" rel="noreferrer">
                    Open PDF or document link
                  </a>
                </p>
              )}
            </div>
            <div className="panel">
              <div className="panel__header">
                <h2 className="panel__title">Commercial</h2>
              </div>
              <p className="form__hint" style={{ marginTop: 0, fontSize: 13 }}>
                Closes: <strong>{tender.closesIn || '—'}</strong>
                <br />
                Estimated value: <strong>{tender.estimatedValue || '—'}</strong>
                <br />
                Bids received: <strong>{tender.bids ?? 0}</strong>
                <br />
                Analytics: <strong>Total {analytics?.totalBids ?? 0}</strong>, Lowest{' '}
                <strong>{analytics?.lowestBid ?? '—'}</strong>, Average{' '}
                <strong>{analytics?.averageBid ?? '—'}</strong>
              </p>
              {tender.buyerOrganization && (
                <p className="form__hint">
                  <strong>Buyer org:</strong> {tender.buyerOrganization}
                </p>
              )}
            </div>
          </div>

          {tenderClosed(tender) && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="form__hint" style={{ margin: 0 }}>
                This tender is <strong>closed</strong> for bidding. {tender.status === 'Closed' ? 'A winner was selected.' : ''}
              </p>
            </div>
          )}

          {isBuyer && isOwner && tender.status === 'Draft' && (
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel__header">
                <h2 className="panel__title">Publish</h2>
              </div>
              <p className="form__hint">Make this tender visible so suppliers can submit bids.</p>
              <button type="button" className="btn btn--gem" onClick={publishTender}>
                Publish tender
              </button>
              {publishMsg && <p className="form__hint" style={{ marginTop: 10 }}>{publishMsg}</p>}
            </div>
          )}

          {tenderChatErr && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="form__error" style={{ margin: 0 }}>
                {tenderChatErr}
              </p>
            </div>
          )}

          {isBuyer && isOwner && (
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel__header">
                <h2 className="panel__title">Bids received</h2>
              </div>
              <p className="form__hint" style={{ marginTop: 0 }}>
                Chat is available with each supplier who has submitted a bid.
              </p>
              {bidsLoading ? (
                <p className="form__hint">Loading bids…</p>
              ) : bids.length === 0 ? (
                <p className="form__hint">No bids yet.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Organization</th>
                        <th>Quote</th>
                        <th>Note</th>
                        <th>Document</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((b) => (
                        <tr key={b.id}>
                          <td>{b.bidderName}</td>
                          <td>{b.bidderOrganization || '—'}</td>
                          <td>{b.bidAmount || b.quotedAmount}</td>
                          <td>{b.note || '—'}</td>
                          <td>{b.document ? <a href={b.document}>View</a> : '—'}</td>
                          <td>{b.status || 'pending'}</td>
                          <td>{b.submittedAt ? new Date(b.submittedAt).toLocaleString() : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                              <Link
                                className="btn btn--ghost btn--sm"
                                to={`/dashboard/tendering/bid/${encodeURIComponent(b.id)}`}
                              >
                                Open
                              </Link>
                              {b.supplierId && (
                                <button
                                  type="button"
                                  className="btn btn--outline btn--sm"
                                  onClick={() => openTenderChat(b.supplierId)}
                                >
                                  Chat
                                </button>
                              )}
                              {biddingOpen && b.status !== 'accepted' ? (
                                <button
                                  className="btn btn--outline btn--sm"
                                  type="button"
                                  onClick={() => chooseWinner(b.id, 'accepted')}
                                >
                                  Select winner
                                </button>
                              ) : b.status === 'accepted' ? (
                                <span className="status status--info">Winner</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="form__field" style={{ marginTop: 8 }}>
                <label className="form__label">Optional reason</label>
                <input className="input" value={winnerReason} onChange={(e) => setWinnerReason(e.target.value)} />
              </div>
            </div>
          )}

          {isSeller && hasMyBid && tender?.createdBy && (
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel__header">
                <h2 className="panel__title">Messages</h2>
              </div>
              <p className="form__hint" style={{ marginTop: 0 }}>
                You have bid on this tender. You can message the buyer.
              </p>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => openTenderChat(tender.createdBy)}
              >
                Message buyer
              </button>
            </div>
          )}

          {biddingOpen && (
            <div className="panel panel--bid" style={{ marginTop: 16 }}>
              <div className="panel__header">
                <h2 className="panel__title">Submit bid (suppliers)</h2>
              </div>
              {!isSeller && (
                <p className="form__hint">
                  <Link to={`/login?next=${encodeURIComponent(`/tenders/${tenderId}`)}`}>
                    Sign in as a supplier
                  </Link>{' '}
                  to submit a bid.
                </p>
              )}
              {isSeller && (
                <form onSubmit={submitBid}>
                  <div className="form-grid-2">
                    <div className="form__field">
                      <label className="form__label">Quoted amount</label>
                      <input
                        className="input"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="e.g. ₹1.2 Cr"
                        required
                      />
                    </div>
                    <div className="form__field">
                      <label className="form__label">Note (optional)</label>
                      <input
                        className="input"
                        value={bidNote}
                        onChange={(e) => setBidNote(e.target.value)}
                        placeholder="Validity, delivery terms…"
                      />
                    </div>
                    <div className="form__field">
                      <label className="form__label">Email</label>
                      <input className="input" value={bidEmail} onChange={(e) => setBidEmail(e.target.value)} required />
                    </div>
                    <div className="form__field">
                      <label className="form__label">Document URL (optional)</label>
                      <input
                        className="input"
                        value={bidDocument}
                        onChange={(e) => setBidDocument(e.target.value)}
                        placeholder="https://... (optional)"
                      />
                    </div>
                  </div>
                  {bidErr && <p className="form__error">{bidErr}</p>}
                  {bidMsg && <p className="form__hint" style={{ color: 'var(--accent-green)' }}>{bidMsg}</p>}
                  <button type="submit" className="btn btn--gem" style={{ marginTop: 10 }}>
                    Submit bid
                  </button>
                </form>
              )}
            </div>
          )}

          {tender.status === 'Published' && !biddingOpen && isSeller && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="form__hint" style={{ margin: 0 }}>
                Bidding is closed for this tender.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default TenderDetails;
