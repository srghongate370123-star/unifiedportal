import React from 'react';
import api from '../../api/client.js';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';

function DirectMessages() {
  const { user } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('c') || '';

  const [conversations, setConversations] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState('');

  const loadConvos = React.useCallback(async () => {
    try {
      const res = await api.get('/api/messages/conversations');
      setConversations(res.data || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadConvos();
    const t = setInterval(loadConvos, 15000);
    return () => clearInterval(t);
  }, [loadConvos]);

  const loadMsgs = React.useCallback(async (cid) => {
    if (!cid) {
      setMessages([]);
      return;
    }
    try {
      const res = await api.get(`/api/messages/conversations/${encodeURIComponent(cid)}/messages`);
      setMessages(res.data || []);
    } catch {
      setMessages([]);
    }
  }, []);

  React.useEffect(() => {
    loadMsgs(selectedId);
  }, [selectedId, loadMsgs]);

  React.useEffect(() => {
    if (!selectedId) return;
    const t = setInterval(() => loadMsgs(selectedId), 8000);
    return () => clearInterval(t);
  }, [selectedId, loadMsgs]);

  const select = (id) => {
    setSearchParams(id ? { c: id } : {});
    setText('');
  };

  const send = async (e) => {
    e.preventDefault();
    if (!selectedId || !text.trim()) return;
    setSending(true);
    setErr('');
    try {
      await api.post(`/api/messages/conversations/${encodeURIComponent(selectedId)}/messages`, {
        body: text.trim()
      });
      setText('');
      await loadMsgs(selectedId);
      await loadConvos();
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  const active = conversations.find((c) => c.id === selectedId);

  return (
    <section className="view view--active">
      <header className="content__header">
        <div>
          <h1 className="content__title">Direct messages</h1>
          <p className="content__subtitle">
            Tender chats (after a bid) and marketplace chats with suppliers.
          </p>
        </div>
      </header>

      <div className="split" style={{ alignItems: 'stretch', minHeight: 420 }}>
        <div className="panel" style={{ maxWidth: 320, flexShrink: 0 }}>
          <h3 className="panel__title" style={{ fontSize: 15, marginBottom: 12 }}>
            Conversations
          </h3>
          {loading ? (
            <p className="form__hint">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="form__hint">No chats yet. Open a tender (as buyer or bidding supplier) or a product page.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`btn ${c.id === selectedId ? 'btn--gem' : 'btn--ghost'}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      marginBottom: 6,
                      display: 'block',
                      whiteSpace: 'normal',
                      height: 'auto',
                      padding: '10px 12px'
                    }}
                    onClick={() => select(c.id)}
                  >
                    <strong>{c.title || c.id}</strong>
                    <div className="form__hint" style={{ marginTop: 4 }}>
                      {c.kind === 'tender' ? 'Tender' : 'Marketplace'} · {c.otherUser?.name || 'User'}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedId ? (
            <p className="form__hint">Select a conversation.</p>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <strong>{active?.title}</strong>
                {active?.otherUser && (
                  <span className="form__hint">
                    {' '}
                    with {active.otherUser.name}
                  </span>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid var(--border, #ddd)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  maxHeight: 360,
                  background: 'var(--surface-muted, #f8f9fa)'
                }}
              >
                {messages.length === 0 ? (
                  <p className="form__hint">No messages yet. Say hello.</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.fromUserId === user?.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          marginBottom: 10,
                          textAlign: mine ? 'right' : 'left'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '8px 12px',
                            borderRadius: 12,
                            background: mine ? 'var(--accent-gem, #0d6efd)' : '#fff',
                            color: mine ? '#fff' : 'inherit',
                            maxWidth: '85%',
                            wordBreak: 'break-word'
                          }}
                        >
                          {m.body}
                        </span>
                        <div className="form__hint" style={{ fontSize: 11, marginTop: 2 }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {err && <p className="form__error">{err}</p>}
              <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  maxLength={8000}
                />
                <button type="submit" className="btn btn--gem" disabled={sending}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="form__hint" style={{ marginTop: 16 }}>
        <Link to="/dashboard/tendering/discover">Discover tenders</Link>
        {' · '}
        <Link to="/dashboard/materials/catalog">Product catalog</Link>
      </p>
    </section>
  );
}

export default DirectMessages;
