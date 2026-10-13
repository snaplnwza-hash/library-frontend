import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import BookCover, { statusInfo } from '../components/BookCover';
import Search from './Search';
import BookDetails from './BookDetails';
import History from './History';
import Reserve from './Reserve';
import Notifications from './Notifications';
import Chatbot from './Chatbot';
import { api } from '../config';

const MAX_BORROW = 5; // จำนวนเล่มที่ยืมได้พร้อมกัน

const menu = [
  { key: 'home', icon: 'home', label: 'หน้าหลัก' },
  { key: 'search', icon: 'search', label: 'ค้นหาหนังสือ' },
  { key: 'reserve', icon: 'calendar', label: 'จองหนังสือ' },
  { key: 'history', icon: 'history', label: 'ประวัติการยืม-คืน' },
  { key: 'notify', icon: 'bell', label: 'แจ้งเตือน' },
  { key: 'chat', icon: 'message', label: 'Help Chat' },
];

// หน้าที่ทำเสร็จแล้ว (เมนูอื่นจะขึ้นว่ากำลังพัฒนา)
const readyPages = ['home', 'search', 'reserve', 'history', 'notify', 'chat'];

export default function Home({ user, onLogout }) {
  const [active, setActive] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [booksError, setBooksError] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [records, setRecords] = useState([]);
  const [chatMessages, setChatMessages] = useState([]); // บทสนทนาแชตบอท (เก็บที่นี่เพื่อไม่ให้หายเมื่อสลับเมนู)
  const [backTo, setBackTo] = useState('search'); // ปุ่มย้อนกลับของหน้ารายละเอียดหนังสือ
  const [unread, setUnread] = useState(0); // จำนวนแจ้งเตือนที่ยังไม่อ่าน (ป้ายที่เมนูและกระดิ่ง)
  const [refreshKey, setRefreshKey] = useState(0); // เพิ่มค่าเมื่อยืมสำเร็จ เพื่อโหลดสถิติใหม่

  // โหลดหนังสือแนะนำใหม่ทุกครั้งที่กลับมาหน้าหลัก เพื่อให้สถานะตรงกับที่เพิ่งยืม
  useEffect(() => {
    if (active !== 'home') return;
    api('/api/books')
      .then((data) => { setBooksError(''); if (Array.isArray(data)) setFeaturedBooks(data.slice(0, 4)); })
      .catch((err) => setBooksError(err.message));
  }, [active]);

  // จำนวนแจ้งเตือนที่ยังไม่อ่าน: โหลดทุกครั้งที่เปลี่ยนหน้า และเช็กซ้ำทุก 1 นาที
  useEffect(() => {
    const load = () => api('/api/notifications/unread-count').then((d) => setUnread(d.unread || 0)).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [active]);

  // สถิติการยืม ดึงใหม่ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    api('/api/borrow-records/me')
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]));
  }, [active, refreshKey]);

  const borrowing = records.filter((r) => !r.return_date).length;
  const stats = [
    { icon: 'bookmark', label: 'หนังสือที่ยืมอยู่', value: borrowing, unit: 'เล่ม' },
    { icon: 'clock', label: 'ยืมได้อีก', value: Math.max(0, MAX_BORROW - borrowing), unit: 'เล่ม' },
    { icon: 'wallet', label: 'ค่าปรับค้างจ่าย', value: 0, unit: 'บาท' }, // TODO: ต่อค่าปรับจริงเมื่อมีใน schema
  ];

  const roleLabel = user.role === 'admin' ? 'บรรณารักษ์' : 'นักศึกษา';
  const soon = (name) => alert(`หน้า "${name}" กำลังพัฒนา`);

  const go = (item) => {
    if (readyPages.includes(item.key)) setActive(item.key);
    else soon(item.label);
  };

  // ไปหน้าค้นหาพร้อมคำค้น (ใช้กับช่องค้นหาบนสุดและช่องในส่วนต้อนรับ)
  const goSearch = (term = '') => {
    setSearchTerm(term);
    setActive('search');
  };

  const handleViewBook = (id) => {
    setBackTo(active === 'chat' ? 'chat' : 'search');
    setSelectedBookId(id);
    setActive('book-details');
  };

  // หน้ารายละเอียดหนังสือให้ไฮไลต์เมนู "ค้นหาหนังสือ"
  const activeMenu = active === 'book-details' ? (backTo === 'chat' ? 'chat' : 'search') : active;
  // History และ Reserve วาดคอลัมน์กลาง+ขวาเอง
  const ownLayout = active === 'history' || active === 'reserve';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><Icon name="book" size={26} /> Campus Library</div>

        <form className="top-search" onSubmit={(e) => { e.preventDefault(); goSearch(e.target.elements.q.value); }}>
          <Icon name="search" size={16} />
          <input name="q" key={searchTerm} defaultValue={searchTerm}
            placeholder="ค้นหาหนังสือ ชื่อเรื่อง ผู้แต่ง หรือ ISBN..." />
        </form>

        <div className="top-right">
          <button className="icon-btn" aria-label={unread > 0 ? `แจ้งเตือน ${unread} รายการที่ยังไม่อ่าน` : 'แจ้งเตือน'} onClick={() => setActive('notify')}>
            <Icon name="bell" size={20} />
            {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
          </button>
          <div className="user-chip">
            <span className="avatar"><Icon name="user" size={18} /></span>
            <span className="user-meta">
              <strong>{user.full_name || 'ผู้ใช้งาน'}</strong>
              <small>รหัส{roleLabel} {user.student_id}</small>
            </span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <Icon name="logout" size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      <div className="body">
        <nav className="sidebar" aria-label="เมนูหลัก">
          {menu.map((m) => (
            <button key={m.key} className={`nav-item ${activeMenu === m.key ? 'active' : ''}`} onClick={() => go(m)}>
              <Icon name={m.icon} size={18} />
              <span>{m.label}</span>
              {m.key === 'notify' && unread > 0 && <em className="badge">{unread}</em>}
            </button>
          ))}
        </nav>

        {active === 'history' && <History />}
        {active === 'reserve' && <Reserve />}

        {!ownLayout && (
          <>
            <main className="content">
              {active === 'home' && (
                <>
                  <section className="welcome">
                    <h2>ยินดีต้อนรับสู่ Campus Library</h2>
                    <p>ห้องสมุดของเรา พร้อมให้คุณค้นพบความรู้ใหม่ๆ</p>
                    <form className="hero-search" onSubmit={(e) => { e.preventDefault(); goSearch(e.target.elements.q.value); }}>
                      <Icon name="search" size={16} />
                      <input name="q" placeholder="ค้นหาหนังสือ ชื่อเรื่อง ผู้แต่ง หรือ ISBN..." />
                      <button type="submit" aria-label="ค้นหา"><Icon name="search" size={18} /></button>
                    </form>
                  </section>

                  <section className="featured">
                    <div className="section-head">
                      <h3>หนังสือแนะนำ</h3>
                      <a href="#" onClick={(e) => { e.preventDefault(); goSearch(''); }}>ดูทั้งหมด &gt;</a>
                    </div>
                    {booksError && <div className="form-error" role="alert">{booksError}</div>}
                    {!booksError && featuredBooks.length === 0 && <p className="muted">ยังไม่มีหนังสือในระบบ</p>}
                    <div className="book-grid">
                      {featuredBooks.map((b) => {
                        const st = statusInfo(b.status);
                        return (
                          <article className="book-card" key={b.book_id}>
                            <BookCover book={b} />
                            <h4>{b.title}</h4>
                            <p>{b.author}</p>
                            <span className={`status ${st.cls}`}>{st.label}</span>
                            <button className="btn-primary sm" onClick={() => handleViewBook(b.book_id)}>ดูรายละเอียด</button>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}

              {active === 'search' && (
                <Search searchTerm={searchTerm} onSearchTermChange={setSearchTerm} onViewBook={handleViewBook} />
              )}

              {active === 'notify' && <Notifications onUnreadChange={setUnread} />}

              {active === 'chat' && (
                <Chatbot messages={chatMessages} setMessages={setChatMessages} onViewBook={handleViewBook} />
              )}

              {active === 'book-details' && (
                <BookDetails bookId={selectedBookId} onBack={() => setActive(backTo)}
                  onBorrowed={() => setRefreshKey((k) => k + 1)} />
              )}
            </main>

            <aside className="right-col">
              <section className="panel">
                <h3>สถิติการยืมของคุณ</h3>
                <ul className="stat-list">
                  {stats.map((s) => (
                    <li key={s.label}>
                      <span className="stat-label"><Icon name={s.icon} size={16} />{s.label}</span>
                      <strong>{s.value} <small>{s.unit}</small></strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel chat-panel">
                <div>
                  <h3>Help Chat</h3>
                  <p>สอบถามข้อมูลหนังสือ กฎระเบียบการยืม-คืน และอื่นๆ</p>
                </div>
                <div className="bot" aria-hidden="true"><i /><i /></div>
                <button className="btn-primary" onClick={() => setActive('chat')}>เริ่มแชท</button>
              </section>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
