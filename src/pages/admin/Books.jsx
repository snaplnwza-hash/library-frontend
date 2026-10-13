import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Icon from '../../components/AdminIcon';
import { Modal, Notice, PageTitle, Pager } from '../../components/Ui';
import { api, BOOK_STATUS, useNotice } from '../../lib';

const empty = { title: '', author: '', isbn: '', category_id: '', status: 'available' };
const PER = 8;

export default function Books({ user, onLogout, onNavigate }) {
  const [books, setBooks] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null = ปิด, object = ฟอร์มเพิ่ม/แก้ไข
  const [msg, run] = useNotice();

  const load = () => run(async () => {
    setBooks(await api('/api/admin/books'));
    setCats(await api('/api/categories'));
  });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const list = books.filter((b) =>
    (!status || b.status === status) &&
    `${b.title} ${b.author} ${b.isbn || ''}`.toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages); // กันกรณีลบแล้วหน้าปัจจุบันเกินจำนวนหน้า
  const visible = list.slice((cur - 1) * PER, cur * PER);

  const save = async (e) => {
    e.preventDefault();
    const edit = form.book_id;
    const ok = await run(() => api(edit ? `/api/admin/books/${edit}` : '/api/admin/books',
      { method: edit ? 'PUT' : 'POST', body: JSON.stringify(form) }), edit ? 'บันทึกข้อมูลหนังสือแล้ว' : 'เพิ่มหนังสือแล้ว');
    if (ok) { setForm(null); load(); }
  };
  const remove = async (b) => {
    if (!window.confirm(`ลบ "${b.title}" ออกจากระบบ?`)) return;
    if (await run(() => api(`/api/admin/books/${b.book_id}`, { method: 'DELETE' }), 'ลบหนังสือแล้ว')) load();
  };
  const addCategory = async () => {
    const name = window.prompt('ชื่อหมวดหมู่ใหม่');
    if (name && await run(() => api('/api/admin/categories', { method: 'POST', body: JSON.stringify({ category_name: name }) }), 'เพิ่มหมวดหมู่แล้ว')) load();
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Shell user={user} onLogout={onLogout} active="books" onNavigate={onNavigate}>
      <main className="content">
        <PageTitle icon="book" title="จัดการหนังสือ" sub="เพิ่ม แก้ไข ลบ และเปลี่ยนสถานะหนังสือ (หนึ่งแถวคือหนึ่งเล่ม)">
          <button className="btn-primary sm fit ghost" onClick={addCategory}>เพิ่มหมวดหมู่</button>
          <button className="btn-primary sm fit" onClick={() => setForm({ ...empty })}><Icon name="plus" size={14} /> เพิ่มหนังสือ</button>
        </PageTitle>
        <Notice msg={msg} />
        <div className="panel filters">
          <label className="field grow"><Icon name="search" size={16} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อเรื่อง ผู้แต่ง หรือ ISBN..." /></label>
          <select aria-label="สถานะ" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">ทุกสถานะ</option>
            {Object.entries(BOOK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <section className="panel">
          {visible.length === 0 ? <p className="empty">ไม่พบหนังสือ ลองเปลี่ยนคำค้นหาหรือเพิ่มหนังสือใหม่</p> : (
            <div className="table-wrap">
              <table className="history-table">
                <thead><tr><th>รหัส</th><th>ชื่อเรื่อง</th><th>ผู้แต่ง</th><th>ISBN</th><th>หมวดหมู่</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {visible.map((b) => (
                    <tr key={b.book_id}>
                      <td>{b.book_id}</td><td><strong>{b.title}</strong></td><td>{b.author}</td><td>{b.isbn || '-'}</td><td>{b.category_name || '-'}</td>
                      <td><span className={`pill st-${b.status}`}>{BOOK_STATUS[b.status] || b.status}</span></td>
                      <td className="row-actions">
                        <button aria-label="แก้ไข" onClick={() => setForm({ ...b, category_id: b.category_id || '', isbn: b.isbn || '' })}><Icon name="edit" size={16} /></button>
                        <button aria-label="ลบ" className="danger" onClick={() => remove(b)}><Icon name="trash" size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={cur} pages={pages} total={list.length} shown={visible.length} onPage={setPage} />
        </section>
      </main>

      {form && (
        <Modal title={form.book_id ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือ'} onClose={() => setForm(null)}>
          <form className="form-grid" onSubmit={save}>
            <label>ชื่อเรื่อง<input required value={form.title} onChange={set('title')} /></label>
            <label>ผู้แต่ง<input required value={form.author} onChange={set('author')} /></label>
            <label>ISBN<input value={form.isbn} onChange={set('isbn')} /></label>
            <label>หมวดหมู่
              <select value={form.category_id} onChange={set('category_id')}>
                <option value="">ไม่ระบุ</option>
                {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select></label>
            <label>สถานะ
              {form.status === 'borrowed' ? (
                // สถานะ "ถูกยืม" เปลี่ยนจากฟอร์มนี้ไม่ได้ ต้องใช้การรับคืนในหน้ายืม-คืน
                <input value={`${BOOK_STATUS.borrowed} (เปลี่ยนได้หลังรับคืน)`} disabled />
              ) : (
                <select value={form.status} onChange={set('status')}>
                  <option value="available">{BOOK_STATUS.available}</option>
                  <option value="maintenance">{BOOK_STATUS.maintenance}</option>
                </select>
              )}
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-primary sm fit ghost" onClick={() => setForm(null)}>ยกเลิก</button>
              <button className="btn-primary sm fit">บันทึก</button>
            </div>
          </form>
        </Modal>
      )}
    </Shell>
  );
}
