// โครงหน้าของบรรณารักษ์: topbar + เมนูด้านข้าง (ใช้คลาส CSS เดียวกับหน้า Home)
import Icon from './AdminIcon';

export const ADMIN_MENU = [
  { key: 'dash', icon: 'dash', label: 'แดชบอร์ด' },
  { key: 'books', icon: 'book', label: 'จัดการหนังสือ' },
  { key: 'members', icon: 'users', label: 'จัดการสมาชิก' },
  { key: 'loans', icon: 'swap', label: 'ยืม-คืน / อนุมัติจอง' },
  { key: 'reports', icon: 'chart', label: 'รายงาน' },
];

export default function Shell({ user, onLogout, active, onNavigate, children }) {
  return (
    <div className="app-shell admin">
      <header className="topbar">
        <div className="brand">
          <Icon name="book" size={26} /> Campus Library <span className="admin-tag">บรรณารักษ์</span>
        </div>
        <div className="spacer" />
        <div className="top-right">
          <div className="user-chip">
            <span className="avatar"><Icon name="user" size={18} /></span>
            <span className="user-meta">
              <strong>{user.full_name || 'ผู้ดูแลระบบ'}</strong>
              <small>รหัสบรรณารักษ์ {user.student_id}</small>
            </span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <Icon name="logout" size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      <div className="body">
        <nav className="sidebar" aria-label="เมนูบรรณารักษ์">
          {ADMIN_MENU.map((m) => (
            <button key={m.key} className={`nav-item ${active === m.key ? 'active' : ''}`} onClick={() => onNavigate(m.key)}>
              <Icon name={m.icon} size={18} />
              <span>{m.label}</span>
            </button>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
