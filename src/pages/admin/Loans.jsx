import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Icon from '../../components/AdminIcon';
import { Modal, Notice, PageTitle } from '../../components/Ui';
import { api, fmtDate, useNotice } from '../../lib';

const FILTERS = [['active', 'ยังไม่คืน'], ['overdue', 'เกินกำหนด'], ['returned', 'คืนแล้ว'], ['all', 'ทั้งหมด']];
// ตรงกับ reservations.status ในฐานข้อมูล: pending / completed / cancelled
const RES = { pending: ['รออนุมัติ', 'borrowing'], completed: ['อนุมัติแล้ว', 'returned'], cancelled: ['ยกเลิก', 'overdue'] };

export default function Loans({ user, onLogout, onNavigate }) {
  const [tab, setTab] = useState('loans');
  const [filter, setFilter] = useState('active');
  const [loans, setLoans] = useState([]);
  const [resv, setResv] = useState([]);
  const [lendForm, setLendForm] = useState(null);
  const [freeBooks, setFreeBooks] = useState([]);
  const [msg, run] = useNotice();

  const load = () => run(async () => {
    setLoans(await api(`/api/admin/borrow-records?status=${filter}`));
    setResv(await api('/api/admin/reservations'));
  });
  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openLend = () => run(async () => {
    const all = await api('/api/admin/books');
    setFreeBooks(all.filter((b) => b.status === 'available'));
    setLendForm({ student_id: '', book_id: '' });
  });
  // ข้อความสำเร็จ (พร้อมวันกำหนดคืน) มาจาก server จึงไม่ต้องใส่ข้อความตายตัวที่นี่
  const lend = async (e) => {
    e.preventDefault();
    if (await run(() => api('/api/admin/borrow', { method: 'POST', body: JSON.stringify(lendForm) }), 'บันทึกการยืมแล้ว')) {
      setLendForm(null);
      load();
    }
  };
  const act = (path, ok, ask) => async () => {
    if (ask && !window.confirm(ask)) return;
    if (await run(() => api(path, { method: 'POST' }), ok)) load();
  };
  const pending = resv.filter((r) => r.status === 'pending').length;

  return (
    <Shell user={user} onLogout={onLogout} active="loans" onNavigate={onNavigate}>
      <main className="content">
        <PageTitle icon="swap" title="ยืม-คืน / อนุมัติจอง" sub="บันทึกการยืม รับคืนหนังสือ และอนุมัติคำขอจอง">
          <button className="btn-primary sm fit" onClick={openLend}><Icon name="plus" size={14} /> บันทึกการยืม</button>
        </PageTitle>
        <Notice msg={msg} />
        <section className="panel">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'loans'} className={tab === 'loans' ? 'active' : ''} onClick={() => setTab('loans')}>รายการยืม-คืน</button>
            <button role="tab" aria-selected={tab === 'resv'} className={tab === 'resv' ? 'active' : ''} onClick={() => setTab('resv')}>คำขอจอง <em>{pending}</em></button>
          </div>

          {tab === 'loans' && (
            <>
              <div className="tabs sub">
                {FILTERS.map(([k, v]) => <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{v}</button>)}
              </div>
              {loans.length === 0 ? <p className="empty">ไม่มีรายการในหมวดนี้</p> : (
                <div className="table-wrap">
                  <table className="history-table">
                    <thead><tr><th>สมาชิก</th><th>หนังสือ</th><th>วันที่ยืม</th><th>กำหนดคืน</th><th>วันที่คืน</th><th>จัดการ</th></tr></thead>
                    <tbody>
                      {loans.map((r) => {
                        const late = !r.return_date && new Date(r.due_date) < new Date();
                        return (
                          <tr key={r.borrow_id} className={late ? 'row-late' : ''}>
                            <td><strong>{r.full_name}</strong><small className="sub-id">{r.student_id}</small></td>
                            <td>{r.title}</td><td>{fmtDate(r.borrow_date)}</td>
                            <td>{fmtDate(r.due_date)}{late && <small className="late-note">เกินกำหนด</small>}</td>
                            <td>{fmtDate(r.return_date)}</td>
                            <td>{!r.return_date && (
                              <button className="btn-primary sm fit"
                                onClick={act(`/api/admin/return/${r.borrow_id}`, 'บันทึกการคืนแล้ว', `รับคืน "${r.title}" จาก ${r.full_name}?`)}>รับคืน</button>
                            )}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'resv' && (resv.length === 0 ? <p className="empty">ยังไม่มีคำขอจอง</p> : (
            <div className="table-wrap">
              <table className="history-table">
                <thead><tr><th>สมาชิก</th><th>หนังสือ</th><th>จองเมื่อ</th><th>สถานะเล่ม</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {resv.map((r) => (
                    <tr key={r.reservation_id}>
                      <td><strong>{r.full_name}</strong><small className="sub-id">{r.student_id}</small></td>
                      <td>{r.title}</td><td>{fmtDate(r.reserved_at)}</td>
                      <td>{r.book_status === 'available' ? 'พร้อมให้ยืม' : 'ยังไม่ว่าง'}</td>
                      <td><span className={`pill ${RES[r.status]?.[1] || ''}`}>{RES[r.status]?.[0] || r.status}</span></td>
                      <td className="row-actions wide-actions">
                        {r.status === 'pending' && <>
                          <button className="btn-primary sm fit" disabled={r.book_status !== 'available'}
                            title={r.book_status !== 'available' ? 'อนุมัติได้เมื่อหนังสือว่าง' : ''}
                            onClick={act(`/api/admin/reservations/${r.reservation_id}/approve`, 'อนุมัติและบันทึกการยืมแล้ว')}>อนุมัติ</button>
                          <button className="btn-primary sm fit ghost" onClick={act(`/api/admin/reservations/${r.reservation_id}/cancel`, 'ยกเลิกคำขอจองแล้ว', 'ยกเลิกคำขอจองนี้?')}>ยกเลิก</button>
                        </>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      </main>

      {lendForm && (
        <Modal title="บันทึกการยืม" onClose={() => setLendForm(null)}>
          <form className="form-grid" onSubmit={lend}>
            <label>รหัสนักศึกษา<input required value={lendForm.student_id} onChange={(e) => setLendForm({ ...lendForm, student_id: e.target.value })} /></label>
            <label>หนังสือที่พร้อมให้ยืม
              <select required value={lendForm.book_id} onChange={(e) => setLendForm({ ...lendForm, book_id: e.target.value })}>
                <option value="">{freeBooks.length ? 'เลือกหนังสือ' : 'ไม่มีหนังสือที่พร้อมให้ยืม'}</option>
                {freeBooks.map((b) => <option key={b.book_id} value={b.book_id}>#{b.book_id} {b.title}</option>)}
              </select></label>
            <div className="modal-actions">
              <button type="button" className="btn-primary sm fit ghost" onClick={() => setLendForm(null)}>ยกเลิก</button>
              <button className="btn-primary sm fit">ยืนยันการยืม</button>
            </div>
          </form>
        </Modal>
      )}
    </Shell>
  );
}
