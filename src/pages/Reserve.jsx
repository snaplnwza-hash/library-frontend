import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import BookCover from '../components/BookCover';
import { api } from '../config';

// แสดงใน <div className="body"> ของ Home (ส่งกลับทั้งคอลัมน์กลางและคอลัมน์ขวา)
export default function Reserve() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [saving, setSaving] = useState(false);

  const load = async (params = { q, category }) => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams(params).toString();
      const data = await api(`/api/books?${qs}`);
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      setBooks([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ q: '', category: '' });
    api('/api/categories').then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => setCategories([]));
  }, []);

  const shown = books.filter((b) =>
    availability === 'yes' ? b.available > 0 : availability === 'no' ? b.available === 0 : true);

  const reserve = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const data = await api('/api/reservations', { method: 'POST', body: JSON.stringify({ book_id: selected.book_id }) });
      setMessage({ type: 'ok', text: data.message || 'จองหนังสือสำเร็จ' });
      setSelected(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const underRepair = selected?.status === 'maintenance';

  return (
    <>
      <main className="content">
        <header className="page-head">
          <Icon name="calendar" size={28} />
          <div>
            <h2>จองหนังสือ</h2>
            <p>เลือกหนังสือที่ต้องการจอง และตรวจสอบสถานะการจองของคุณได้ที่นี่</p>
          </div>
        </header>

        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className={message.type === 'ok' ? 'notice ok' : 'form-error'} role="status">{message.text}</div>}

        <form className="panel filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <label className="field">
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาหนังสือ ชื่อเรื่อง ผู้แต่ง หรือ ISBN..." />
          </label>
          <select aria-label="หมวดหมู่" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
          <select aria-label="สถานะหนังสือ" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">สถานะหนังสือ: ทั้งหมด</option>
            <option value="yes">มีเล่มให้บริการ</option>
            <option value="no">ถูกยืมครบทุกเล่ม</option>
          </select>
          <button className="btn-primary sm fit" type="submit">ค้นหา</button>
        </form>

        <section className="panel">
          <h3>ผลการค้นหา ({shown.length} รายการ)</h3>
          {loading ? <p className="empty">กำลังโหลด...</p> : shown.length === 0 ? (
            <p className="empty">ไม่พบหนังสือที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหรือหมวดหมู่</p>
          ) : (
            <ul className="reserve-list">
              {shown.map((b) => (
                <li key={b.book_id} className={selected?.book_id === b.book_id ? 'picked' : ''}>
                  <BookCover book={b} small />
                  <div className="reserve-info">
                    <strong>{b.title}</strong>
                    <span>{b.author}</span>
                    {b.category_name && <em className="tag">{b.category_name}</em>}
                  </div>
                  <div className="reserve-meta">
                    <span className={b.available > 0 ? 'ok-text' : 'danger-text'}>มีให้บริการ: {b.available} เล่ม</span>
                    <span>รอคิวแล้ว: {b.queue} คน</span>
                  </div>
                  <button className="btn-primary sm fit" onClick={() => { setSelected(b); setMessage(null); }}>จองหนังสือ</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <aside className="right-col">
        <section className="panel">
          <h3>ข้อมูลการจองหนังสือ</h3>
          {!selected ? <p className="empty">เลือกหนังสือจากรายการเพื่อดูรายละเอียดและยืนยันการจอง</p> : (
            <>
              <div className="detail-head">
                <BookCover book={selected} small />
                <div><strong>{selected.title}</strong><p>{selected.author}</p></div>
              </div>
              <ul className="stat-list">
                <li><span className="stat-label">จำนวนที่มีให้บริการ</span><strong>{selected.available} เล่ม</strong></li>
                <li><span className="stat-label">จำนวนที่จองแล้ว</span><strong>{selected.queue} รายการ</strong></li>
                <li><span className="stat-label">สถานะหนังสือ</span>
                  <span className={`status ${selected.available > 0 ? 'ok' : 'out'}`}>
                    {underRepair ? 'ส่งซ่อม' : selected.available > 0 ? 'พร้อมจอง' : 'รอคิว'}
                  </span></li>
              </ul>
              <p className="hint">
                {underRepair
                  ? 'หนังสือเล่มนี้อยู่ระหว่างซ่อม ยังจองไม่ได้ในตอนนี้'
                  : selected.available > 0
                    ? 'รับหนังสือภายใน 3 วัน หลังจากได้รับการแจ้งเตือน หากไม่มารับภายในกำหนด การจองจะถูกยกเลิก'
                    : 'ทุกเล่มถูกยืมอยู่ คุณจะอยู่ในคิวและได้รับแจ้งเตือนเมื่อมีเล่มว่าง'}
              </p>
              <button className="btn-primary" disabled={saving || underRepair} onClick={reserve}>
                {saving ? 'กำลังจอง...' : 'ยืนยันการจอง'}
              </button>
            </>
          )}
        </section>
      </aside>
    </>
  );
}
