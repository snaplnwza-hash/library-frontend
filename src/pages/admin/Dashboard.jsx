import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Icon from '../../components/AdminIcon';
import { Notice, PageTitle } from '../../components/Ui';
import { api, fmtDate, useNotice } from '../../lib';

export default function Dashboard({ user, onLogout, onNavigate }) {
  const [data, setData] = useState(null);
  const [msg, run] = useNotice();
  useEffect(() => { run(async () => setData(await api('/api/admin/stats'))); }, [run]);

  const c = data?.counts;
  const cards = c && [
    { icon: 'book', label: 'หนังสือทั้งหมด', n: c.total_books, note: `พร้อมให้ยืม ${c.available} · ซ่อมบำรุง ${c.maintenance}` },
    { icon: 'swap', label: 'กำลังถูกยืม', n: c.borrowed, note: 'เล่มที่ยังไม่ได้คืน', go: 'loans' },
    { icon: 'users', label: 'สมาชิก', n: c.members, note: 'ไม่รวมบรรณารักษ์', go: 'members' },
    { icon: 'alert', label: 'เกินกำหนดคืน', n: c.overdue, note: 'ต้องติดตามทวงถาม', warn: c.overdue > 0, go: 'reports' },
    { icon: 'calendar', label: 'คำขอจองรออนุมัติ', n: c.pending_reservations, note: 'ไปที่หน้ายืม-คืน', warn: c.pending_reservations > 0, go: 'loans' },
  ];

  const statusOf = (r) => {
    if (r.return_date) return ['returned', 'คืนแล้ว'];
    if (new Date(r.due_date) < new Date()) return ['overdue', 'เกินกำหนด'];
    return ['borrowing', 'ยืมอยู่'];
  };

  return (
    <Shell user={user} onLogout={onLogout} active="dash" onNavigate={onNavigate}>
      <main className="content">
        <PageTitle icon="dash" title="แดชบอร์ด" sub="ภาพรวมการใช้งานห้องสมุดวันนี้" />
        <Notice msg={msg} />
        {cards && (
          <section className="stat-cards">
            {cards.map((k) => (
              <button key={k.label} className={`stat-card${k.warn ? ' warn' : ''}`} disabled={!k.go} onClick={() => onNavigate(k.go)}>
                <Icon name={k.icon} size={20} />
                <strong>{k.n}</strong>
                <span>{k.label}</span>
                <small>{k.note}</small>
              </button>
            ))}
          </section>
        )}
        <section className="panel">
          <h3>รายการยืม-คืนล่าสุด</h3>
          {data && data.recent.length === 0 && <p className="empty">ยังไม่มีรายการยืม-คืน</p>}
          {data && data.recent.length > 0 && (
            <div className="table-wrap">
              <table className="history-table">
                <thead><tr><th>สมาชิก</th><th>หนังสือ</th><th>วันที่ยืม</th><th>กำหนดคืน</th><th>สถานะ</th></tr></thead>
                <tbody>
                  {data.recent.map((r) => {
                    const [cls, label] = statusOf(r);
                    return (
                      <tr key={r.borrow_id}>
                        <td>{r.full_name}</td><td>{r.title}</td><td>{fmtDate(r.borrow_date)}</td><td>{fmtDate(r.due_date)}</td>
                        <td><span className={`pill ${cls}`}>{label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </Shell>
  );
}
