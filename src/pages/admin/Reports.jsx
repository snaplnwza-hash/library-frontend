import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { Bars, Notice, PageTitle } from '../../components/Ui';
import { api, downloadCsv, fmtDate, toISO, useNotice } from '../../lib';

export default function Reports({ user, onLogout, onNavigate }) {
  const today = new Date();
  const [from, setFrom] = useState(toISO(new Date(today.getFullYear(), today.getMonth() - 5, 1)));
  const [to, setTo] = useState(toISO(today));
  const [data, setData] = useState(null);
  const [msg, run] = useNotice();

  useEffect(() => { run(async () => setData(await api(`/api/admin/reports?from=${from}&to=${to}`))); }, [from, to, run]);

  const exportOverdue = () => downloadCsv(`overdue-${to}.csv`, data.overdue.map((r) => ({
    รหัส: r.student_id, ชื่อ: r.full_name, หนังสือ: r.title, กำหนดคืน: toISO(r.due_date), ล่าช้า_วัน: r.days_late })));

  return (
    <Shell user={user} onLogout={onLogout} active="reports" onNavigate={onNavigate}>
      <main className="content">
        <PageTitle icon="chart" title="รายงานการใช้งาน" sub="สรุปการยืม-คืน หนังสือยอดนิยม และรายการเกินกำหนด" />
        <Notice msg={msg} />
        <div className="panel filters">
          <label className="date-field">ตั้งแต่<input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
          <label className="date-field">ถึง<input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
        </div>
        {data && (
          <>
            <section className="stat-cards three">
              <div className="stat-card"><strong>{data.summary.borrowed}</strong><span>ยืมทั้งหมดในช่วงนี้</span></div>
              <div className="stat-card"><strong>{data.summary.returned}</strong><span>คืนในช่วงนี้</span></div>
              <div className={`stat-card${data.overdue.length ? ' warn' : ''}`}><strong>{data.overdue.length}</strong><span>เกินกำหนด ณ ปัจจุบัน</span></div>
            </section>
            <div className="two-col">
              <section className="panel"><h3>การยืมรายเดือน</h3><Bars items={data.monthly} /></section>
              <section className="panel"><h3>หนังสือยืมมากที่สุด 5 อันดับ</h3><Bars items={data.top} /></section>
              <section className="panel"><h3>การยืมตามหมวดหมู่</h3><Bars items={data.categories} /></section>
            </div>
            <section className="panel">
              <div className="section-head">
                <h3>รายการเกินกำหนดคืน</h3>
                <button className="btn-primary sm fit ghost" disabled={!data.overdue.length} onClick={exportOverdue}>ส่งออก CSV</button>
              </div>
              {data.overdue.length === 0 ? <p className="empty">ไม่มีรายการเกินกำหนด</p> : (
                <div className="table-wrap">
                  <table className="history-table">
                    <thead><tr><th>สมาชิก</th><th>หนังสือ</th><th>กำหนดคืน</th><th>ล่าช้า</th></tr></thead>
                    <tbody>
                      {data.overdue.map((r, i) => (
                        <tr key={i} className="row-late">
                          <td><strong>{r.full_name}</strong><small className="sub-id">{r.student_id}</small></td>
                          <td>{r.title}</td><td>{fmtDate(r.due_date)}</td><td><span className="pill overdue">{r.days_late} วัน</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </Shell>
  );
}
