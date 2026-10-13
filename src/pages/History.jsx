import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import BookCover from '../components/BookCover';
import { api, fmtDate, dayKey } from '../config';

const DAY = 86400000;
const PER_PAGE = 5;

// ยืมอยู่ / คืนแล้ว / เกินกำหนด คำนวณจากวันที่ในตาราง borrow_records
function statusOf(r) {
  if (r.return_date) return { key: 'returned', label: 'คืนแล้ว' };
  const late = Math.floor((Date.now() - new Date(r.due_date)) / DAY);
  return late > 0 ? { key: 'overdue', label: 'เกินกำหนด', late } : { key: 'borrowing', label: 'ยืมอยู่' };
}

// แสดงใน <div className="body"> ของ Home (ส่งกลับทั้งคอลัมน์กลางและคอลัมน์ขวา)
export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/borrow-records/me');
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const withStatus = rows.map((r) => ({ ...r, st: statusOf(r) }));
  const term = q.trim().toLowerCase();
  const inRange = withStatus.filter((r) =>
    (!term || `${r.title} ${r.author}`.toLowerCase().includes(term)) &&
    (!from || dayKey(r.borrow_date) >= from) &&
    (!to || dayKey(r.borrow_date) <= to));
  const count = (k) => inRange.filter((r) => r.st.key === k).length;
  const list = tab === 'all' ? inRange : inRange.filter((r) => r.st.key === tab);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const visible = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const tabs = [
    { key: 'all', label: 'ทั้งหมด', n: inRange.length },
    { key: 'borrowing', label: 'ยืมอยู่', n: count('borrowing') },
    { key: 'returned', label: 'คืนแล้ว', n: count('returned') },
    { key: 'overdue', label: 'เกินกำหนด', n: count('overdue') },
  ];
  const reset = () => { setQ(''); setFrom(''); setTo(''); setTab('all'); setPage(1); load(); };

  return (
    <>
      <main className="content">
        <header className="page-head">
          <Icon name="history" size={28} />
          <div>
            <h2>ประวัติการยืม-คืน</h2>
            <p>ตรวจสอบรายการยืมหนังสือและประวัติการคืนที่ผ่านมา</p>
          </div>
        </header>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="panel filters">
          <label className="field">
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อหนังสือ ผู้แต่ง..." />
          </label>
          <label className="date-field">ตั้งแต่
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /></label>
          <label className="date-field">ถึง
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></label>
          <button className="btn-primary sm fit" onClick={reset}><Icon name="refresh" size={14} /> รีเฟรช</button>
        </div>

        <section className="panel">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''}
                onClick={() => { setTab(t.key); setPage(1); }}>
                {t.label} <em>{t.n}</em>
              </button>
            ))}
          </div>

          {loading ? <p className="empty">กำลังโหลด...</p> : visible.length === 0 ? (
            <p className="empty">ไม่พบรายการยืม-คืนในช่วงที่เลือก</p>
          ) : (
            <div className="table-wrap">
              <table className="history-table">
                <thead><tr><th>ลำดับ</th><th>ชื่อหนังสือ</th><th>ผู้แต่ง</th><th>วันที่ยืม</th><th>กำหนดคืน</th><th>วันที่คืน</th><th>สถานะ</th></tr></thead>
                <tbody>
                  {visible.map((r, i) => (
                    <tr key={r.borrow_id} className={r.st.key === 'overdue' ? 'row-late' : ''}>
                      <td>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td><div className="title-cell"><BookCover book={r} small /><strong>{r.title}</strong></div></td>
                      <td>{r.author}</td>
                      <td>{fmtDate(r.borrow_date)}</td>
                      <td>{fmtDate(r.due_date)}</td>
                      <td>{fmtDate(r.return_date)}</td>
                      <td>
                        <span className={`pill ${r.st.key}`}>{r.st.label}</span>
                        {r.st.late && <small className="late-note">ล่าช้า {r.st.late} วัน</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="pager">
            <span>แสดง {visible.length} จาก {list.length} รายการ</span>
            <div>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="ก่อนหน้า">‹</button>
              <b>{page} / {pages}</b>
              <button disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="ถัดไป">›</button>
            </div>
          </footer>
        </section>
      </main>

      <aside className="right-col">
        <section className="panel">
          <h3>สรุปการยืม-คืน</h3>
          <ul className="stat-list">
            <li><span className="stat-label"><Icon name="book" size={16} />ยืมอยู่</span><strong>{count('borrowing')} <small>รายการ</small></strong></li>
            <li><span className="stat-label"><Icon name="check" size={16} />คืนแล้ว</span><strong>{count('returned')} <small>รายการ</small></strong></li>
            <li><span className="stat-label"><Icon name="alert" size={16} />เกินกำหนด</span><strong className={count('overdue') ? 'danger-text' : ''}>{count('overdue')} <small>รายการ</small></strong></li>
          </ul>
          {count('overdue') > 0 && <p className="hint">กรุณาคืนหนังสือที่เกินกำหนดโดยเร็ว เพื่อหลีกเลี่ยงค่าปรับเพิ่ม</p>}
        </section>
      </aside>
    </>
  );
}
