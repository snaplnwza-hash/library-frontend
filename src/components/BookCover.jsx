const coverColors = [
  { bg: '#0d1b2a', fg: '#e8eef7' },
  { bg: '#f1e6d2', fg: '#3b2f1e' },
  { bg: '#f4f1ea', fg: '#1b3a5c' },
  { bg: '#f2c230', fg: '#1a1a1a' },
];

// ปกจำลองด้วย CSS (สีคงที่ตาม book_id) เปลี่ยนเป็น <img src={book.cover_url}> เมื่อมีรูปจริง
export default function BookCover({ book, small = false }) {
  const c = coverColors[(book.book_id ?? 0) % coverColors.length];
  return (
    <div className={`cover${small ? ' small' : ''}`} style={{ background: c.bg, color: c.fg }}>
      {!small && <span>{book.title}</span>}
      {!small && <small>{book.author}</small>}
    </div>
  );
}

// แปลงสถานะหนังสือเป็นข้อความและคลาสสี
export function statusInfo(status) {
  if (status === 'available') return { label: 'พร้อมให้ยืม', cls: 'ok' };
  if (status === 'maintenance') return { label: 'ส่งซ่อม', cls: 'out' };
  return { label: 'ถูกยืมแล้ว', cls: 'out' };
}
