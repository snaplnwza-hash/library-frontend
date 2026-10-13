import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Icon from '../../components/AdminIcon';
import { Modal, Notice, PageTitle, Pager } from '../../components/Ui';
import { api, fmtDate, useNotice } from '../../lib';

const empty = { student_id: '', full_name: '', email: '', password: '', role: 'student' };
// ตรงกับ enum user_role ในฐานข้อมูล: student / staff / admin
const ROLE = { student: 'นักศึกษา', staff: 'อาจารย์', admin: 'บรรณารักษ์' };
const PER = 8;

export default function Members({ user, onLogout, onNavigate }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [msg, run] = useNotice();

  const load = () => run(async () => setRows(await api('/api/admin/users')));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const list = rows.filter((u) => (!role || u.role === role) &&
    `${u.student_id} ${u.full_name} ${u.email || ''}`.toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages);
  const visible = list.slice((cur - 1) * PER, cur * PER);

  const save = async (e) => {
    e.preventDefault();
    const edit = form.user_id;
    const ok = await run(() => api(edit ? `/api/admin/users/${edit}` : '/api/admin/users',
      { method: edit ? 'PUT' : 'POST', body: JSON.stringify(form) }), edit ? 'บันทึกข้อมูลสมาชิกแล้ว' : 'เพิ่มสมาชิกแล้ว');
    if (ok) { setForm(null); load(); }
  };
  const remove = async (u) => {
    if (!window.confirm(`ลบสมาชิก "${u.full_name}"?`)) return;
    if (await run(() => api(`/api/admin/users/${u.user_id}`, { method: 'DELETE' }), 'ลบสมาชิกแล้ว')) load();
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isSelf = (u) => u.user_id === user.user_id;

  return (
    <Shell user={user} onLogout={onLogout} active="members" onNavigate={onNavigate}>
      <main className="content">
        <PageTitle icon="users" title="จัดการสมาชิก" sub="ข้อมูลผู้ใช้งาน สิทธิ์ และรหัสผ่าน">
          <button className="btn-primary sm fit" onClick={() => setForm({ ...empty })}><Icon name="plus" size={14} /> เพิ่มสมาชิก</button>
        </PageTitle>
        <Notice msg={msg} />
        <div className="panel filters">
          <label className="field grow"><Icon name="search" size={16} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ค้นหารหัส ชื่อ หรืออีเมล..." /></label>
          <select aria-label="สิทธิ์" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">ทุกสิทธิ์</option>
            {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <section className="panel">
          {visible.length === 0 ? <p className="empty">ไม่พบสมาชิก</p> : (
            <div className="table-wrap">
              <table className="history-table">
                <thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>อีเมล</th><th>สิทธิ์</th><th>กำลังยืม</th><th>สมัครเมื่อ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {visible.map((u) => (
                    <tr key={u.user_id}>
                      <td>{u.student_id}</td><td><strong>{u.full_name}</strong></td><td>{u.email || '-'}</td>
                      <td><span className={`pill ${u.role === 'admin' ? 'borrowing' : 'returned'}`}>{ROLE[u.role] || u.role}</span></td>
                      <td>{u.active_loans} เล่ม</td><td>{fmtDate(u.created_at)}</td>
                      <td className="row-actions">
                        <button aria-label="แก้ไข" onClick={() => setForm({ ...u, email: u.email || '', password: '' })}><Icon name="edit" size={16} /></button>
                        <button aria-label="ลบ" className="danger" disabled={isSelf(u)} title={isSelf(u) ? 'ลบบัญชีที่กำลังใช้งานอยู่ไม่ได้' : ''} onClick={() => remove(u)}><Icon name="trash" size={16} /></button>
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
        <Modal title={form.user_id ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิก'} onClose={() => setForm(null)}>
          <form className="form-grid" onSubmit={save}>
            <label>รหัสนักศึกษา<input required value={form.student_id} onChange={set('student_id')} /></label>
            <label>ชื่อ-สกุล<input required value={form.full_name} onChange={set('full_name')} /></label>
            {/* users.email เป็น NOT NULL ในฐานข้อมูล จึงต้องกรอก */}
            <label>อีเมล<input type="email" required value={form.email} onChange={set('email')} /></label>
            <label>{form.user_id ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)'}
              <input type="password" required={!form.user_id} minLength={6} value={form.password} onChange={set('password')} autoComplete="new-password" /></label>
            <label>สิทธิ์
              <select value={form.role} onChange={set('role')} disabled={form.user_id === user.user_id}>
                {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></label>
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
