// ส่วนประกอบหน้าจอที่หน้า Admin ใช้ร่วมกัน
import { useEffect } from 'react';
import Icon from './AdminIcon';

export function PageTitle({ icon, title, sub, children }) {
  return (
    <div className="page-title">
      <div>
        <h2>{icon && <Icon name={icon} size={22} />}{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="pt-actions">{children}</div>}
    </div>
  );
}

// msg = { type: 'ok' | 'err', text } หรือ null (มาจาก useNotice)
export function Notice({ msg }) {
  if (!msg) return null;
  return (
    <div className={`notice ${msg.type}`} role={msg.type === 'err' ? 'alert' : 'status'}>
      {msg.text}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" aria-label="ปิด" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pager({ page, pages, total, shown, onPage }) {
  if (total === 0) return null;
  return (
    <div className="pager">
      <span>แสดง {shown} จาก {total} รายการ</span>
      <div className="pager-nav">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>ก่อนหน้า</button>
        <span>หน้า {page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>ถัดไป</button>
      </div>
    </div>
  );
}

// กราฟแท่งแนวนอนอย่างง่าย items = [{ label, value }]
export function Bars({ items = [] }) {
  if (items.length === 0) return <p className="empty">ไม่มีข้อมูลในช่วงนี้</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="bars">
      {items.map((i, idx) => (
        <li key={`${i.label}-${idx}`}>
          <span className="bar-label" title={i.label}>{i.label}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <strong>{i.value}</strong>
        </li>
      ))}
    </ul>
  );
}
