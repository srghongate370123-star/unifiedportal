import React from 'react';
import api from '../api/client.js';
import { useNavigate } from 'react-router-dom';

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const ref = React.useRef(null);

  const load = React.useCallback(() => {
    api
      .get('/api/notifications')
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]));
  }, []);

  React.useEffect(() => {
    load();
    const i = setInterval(load, 25000);
    return () => clearInterval(i);
  }, [load]);

  React.useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const markAll = async (e) => {
    e.stopPropagation();
    await api.patch('/api/notifications/read-all').catch(() => {});
    load();
  };

  const onItem = async (n) => {
    if (!n.read) {
      await api.patch(`/api/notifications/${encodeURIComponent(n.id)}/read`).catch(() => {});
    }
    setOpen(false);
    if (n.href) {
      navigate(n.href);
    }
    load();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn--ghost"
        aria-label="Notifications"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          load();
        }}
        style={{ position: 'relative' }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              fontSize: 10,
              lineHeight: '16px',
              borderRadius: 8,
              background: '#c0392b',
              color: '#fff'
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="panel"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 320,
            maxHeight: 380,
            overflowY: 'auto',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Notifications</strong>
            {items.some((n) => !n.read) && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="form__hint" style={{ margin: 0 }}>
              No notifications yet. New chat messages appear here.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onItem(n)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 8px',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      background: n.read ? 'transparent' : 'rgba(13,110,253,0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                    <div className="form__hint" style={{ fontSize: 12, marginTop: 4 }}>
                      {n.body}
                    </div>
                    <div className="form__hint" style={{ fontSize: 11, marginTop: 4 }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
