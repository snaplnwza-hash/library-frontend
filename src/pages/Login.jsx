import { useState } from 'react';
import Icon from '../components/Icon';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export default function Login({ onLogin }) {
  const [tab, setTab] = useState('student'); // student | admin
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง');

      const user = data.user || data;
      if (tab === 'admin' && user.role !== 'admin') {
        throw new Error('บัญชีนี้ไม่มีสิทธิ์บรรณารักษ์ (Admin)');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="login-hero-text">
          <h1>Campus Library</h1>
          <p>อ่านวันนี้ สร้างอนาคตที่ดีกว่า</p>
        </div>
        <ul className="login-features">
          <li><Icon name="book" size={30} /><strong>ยืม-คืนหนังสือ</strong><span>ได้ง่าย สะดวก</span></li>
          <li><Icon name="search" size={30} /><strong>ค้นหาหนังสือ</strong><span>ได้ทันที</span></li>
          <li><Icon name="message" size={30} /><strong>Help Chat ช่วยตอบคำถาม</strong><span>ตอบคำถามตลอด 24 ชม.</span></li>
        </ul>
      </aside>

      <main className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-logo"><Icon name="book" size={40} /></div>
          <h2>เข้าสู่ระบบ</h2>
          <p className="login-sub">ยืม-คืนหนังสือ ห้องสมุดมหาวิทยาลัย</p>

          <div className="role-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'student'}
              className={tab === 'student' ? 'active' : ''} onClick={() => setTab('student')}>
              นักศึกษา / อาจารย์
            </button>
            <button type="button" role="tab" aria-selected={tab === 'admin'}
              className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>
              บรรณารักษ์ (Admin)
            </button>
          </div>

          <label className="field">
            <Icon name="user" size={16} />
            <input type="text" placeholder="Student ID" value={studentId}
              onChange={(e) => setStudentId(e.target.value)} required autoComplete="username" />
          </label>

          <label className="field">
            <Icon name="lock" size={16} />
            <input type={showPw ? 'text' : 'password'} placeholder="รหัสผ่าน" value={password}
              onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" className="eye" onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
              <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </label>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          <a href="#" className="forgot" onClick={(e) => { e.preventDefault(); alert('กรุณาติดต่อเจ้าหน้าที่ห้องสมุดเพื่อรีเซ็ตรหัสผ่าน'); }}>
            ลืมรหัสผ่าน?
          </a>

          <div className="divider"><span>หรือ</span></div>

          <button type="button" className="btn-sso"
            onClick={() => alert('ระบบ SSO ของมหาวิทยาลัยยังไม่เปิดใช้งาน')}>
            <Icon name="message" size={18} /> เข้าสู่ระบบด้วย SSO (มหาวิทยาลัย)
          </button>
        </form>
      </main>
    </div>
  );
}
