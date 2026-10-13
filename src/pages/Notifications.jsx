import { useEffect, useState } from 'react';
import Icon from '../components/AdminIcon';
import { api } from '../lib';
import './notifications.css';

// ประเภทแจ้งเตือน (notifications.type) -> ไอคอนและโทนสี
const TYPES = {
  borrowed: { icon: 'book', tone: 'info' },
  returned: { icon: 'check', tone: 'ok' },
  due_soon: { icon: 'clock', tone: 'warn' },
  overdue: { icon: 'alert', tone: 'danger' },
  reservation_ready: { icon: 'calendar', tone: 'ok' },
  reservation_cancelled: { icon: 'calendar', tone: 'muted' },
};

const fmtDateTime = (v) =>
  new Date(v).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Notifications({ onUnreadChange }) {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all'); // all | unread
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/notifications/me')
      .then((data) => { setItems(data.items); onUnreadChange?.(data.unread); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unread = items.filter((n) => !n.is_read).length;
  const shown = tab === 'unread' ? items.filter((n) => !n.is_read) : items;

  const update = (next) => {
    setItems(next);
    onUnreadChange?.(next.filter((n) => !n.is_read).length);
  };

  const markRead = async (n) => {
    if (n.is_read) return;
    setError('');
    try {
      await api(`/api/notifications/${n.notification_id}/read`, { method: 'POST' });
      update(items.map((x) => (x.notification_id === n.notification_id ? { ...x, is_read: true } : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const markAll = async () => {
    setError('');
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
      update(items.map((x) => ({ ...x, is_read: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="notif-page">
      <div className="notif-head">
        <span className="notif-head-icon"><Icon name="bell" size={26} /></span>
        <div>
          <h2>แจ้งเตือน</h2>
          <p>การยืม-คืน กำหนดคืน และสถานะการจองของคุณ</p>
        </div>
      </div>

      <section className="notif-panel">
        <div className="notif-bar">
          <div className="notif-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
              ทั้งหมด <em>{items.length}</em>
            </button>
            <button role="tab" aria-selected={tab === 'unread'} className={tab === 'unread' ? 'active' : ''} onClick={() => setTab('unread')}>
              ยังไม่อ่าน <em>{unread}</em>
            </button>
          </div>
          <button className="notif-readall" disabled={unread === 0} onClick={markAll}>อ่านทั้งหมด</button>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}
        {loading && <p className="notif-empty">กำลังโหลด...</p>}
        {!loading && !error && shown.length === 0 && (
          <p className="notif-empty">{tab === 'unread' ? 'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน' : 'ยังไม่มีการแจ้งเตือน เมื่อมีการยืม คืน หรือใกล้ครบกำหนด จะแสดงที่นี่'}</p>
        )}

        <ul className="notif-list">
          {shown.map((n) => {
            const t = TYPES[n.type] || { icon: 'bell', tone: 'info' };
            return (
              <li key={n.notification_id}>
                <button className={`notif-item${n.is_read ? '' : ' unread'}`} onClick={() => markRead(n)}
                  aria-label={`${n.title} ${n.is_read ? '' : '(ยังไม่อ่าน)'}`}>
                  <span className={`notif-icon ${t.tone}`}><Icon name={t.icon} size={18} /></span>
                  <span className="notif-body">
                    <strong>{n.title}</strong>
                    <span>{n.message}</span>
                    <small>{fmtDateTime(n.created_at)}</small>
                  </span>
                  {!n.is_read && <span className="notif-dot" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
