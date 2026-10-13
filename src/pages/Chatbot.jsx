import { useEffect, useRef, useState } from 'react';
import Icon from '../components/AdminIcon';
import { statusInfo } from '../components/BookCover';
import { api } from '../lib';
import './chatbot.css';

// ข้อความต้อนรับ (ไม่เก็บใน state จึงไม่หายและไม่ซ้ำ)
const GREETING = {
  id: 'greeting',
  role: 'bot',
  text: 'สวัสดี ฉันคือผู้ช่วยห้องสมุด ถามหาหนังสือตามหัวข้อ ชื่อเรื่อง หรือผู้แต่งได้เลย เช่น "มีหนังสือสอนเขียนโปรแกรมภาษา Python ไหม" หรือถามเรื่องกฎการยืม-คืน',
  suggestions: ['มีหนังสือสอน Python ไหม', 'มีหมวดหมู่อะไรบ้าง', 'ยืมได้กี่เล่ม กี่วัน'],
};

// messages / setMessages อยู่ที่ Home เพื่อให้บทสนทนาไม่หายเมื่อสลับเมนู
export default function Chatbot({ messages, setMessages, onViewBook }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const seq = useRef(0);
  const all = [GREETING, ...messages];

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, sending]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput('');
    seq.current += 1;
    const id = seq.current;
    setMessages((prev) => [...prev, { id: `u${id}`, role: 'user', text: message }]);
    setSending(true);
    try {
      const reply = await api('/api/chat', { method: 'POST', body: JSON.stringify({ message }) });
      setMessages((prev) => [...prev, { id: `b${id}`, role: 'bot', ...reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: `b${id}`, role: 'bot', error: true, text: err.message || 'ขออภัย เกิดข้อผิดพลาด' }]);
    } finally {
      setSending(false);
    }
  };

  const last = all[all.length - 1];

  return (
    <div className="cb-page">
      <div className="cb-head">
        <span className="cb-head-icon"><Icon name="message" size={26} /></span>
        <div>
          <h2>Help Chat</h2>
          <p>สอบถามข้อมูลหนังสือ กฎระเบียบการยืม-คืน และอื่นๆ</p>
        </div>
      </div>

      <section className="cb-panel">
        <div className="cb-list" ref={listRef} role="log" aria-live="polite" aria-label="ข้อความสนทนา">
          {all.map((m) => (
            <div key={m.id} className={`cb-row ${m.role === 'user' ? 'cb-me' : 'cb-ai'}`}>
              <div className={`cb-bubble${m.error ? ' cb-error' : ''}`}>
                <p>{m.text}</p>

                {m.books && m.books.length > 0 && (
                  <ul className="cb-books">
                    {m.books.map((b) => {
                      const st = statusInfo(b.status);
                      return (
                        <li key={b.book_id} className="cb-book">
                          <div className="cb-book-info">
                            <strong>{b.title}</strong>
                            <span>{b.author}{b.category_name ? ` · ${b.category_name}` : ''}</span>
                          </div>
                          <span className={`status ${st.cls}`}>{st.label}</span>
                          <button type="button" className="cb-book-btn" onClick={() => onViewBook(b.book_id)}>ดูรายละเอียด</button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {m === last && m.suggestions && m.suggestions.length > 0 && (
                  <div className="cb-chips">
                    {m.suggestions.map((s) => (
                      <button key={s} type="button" disabled={sending} onClick={() => send(s)}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="cb-row cb-ai">
              <div className="cb-bubble cb-typing" aria-label="กำลังค้นหา"><i /><i /><i /></div>
            </div>
          )}
        </div>

        <form className="cb-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={300}
            placeholder="พิมพ์คำถาม เช่น มีหนังสือสอน Python ไหม" aria-label="พิมพ์ข้อความ" />
          <button type="submit" disabled={sending || !input.trim()} aria-label="ส่งข้อความ">
            <Icon name="send" size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}
