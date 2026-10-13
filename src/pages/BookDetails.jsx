import { useState, useEffect } from 'react';
import BookCover, { statusInfo } from '../components/BookCover';
import { api } from '../config';

function BookDetails({ bookId, onBack, onBorrowed }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [borrowing, setBorrowing] = useState(false);

  const loadBook = () => api(`/api/books/${bookId}`).then(setBook);

  useEffect(() => {
    setLoading(true);
    setError('');
    setMessage(null);
    loadBook()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookId]);

  const backButton = (
    <button className="back-link" onClick={onBack}>← กลับไปหน้าค้นหา</button>
  );

  if (loading) return <div className="page">{backButton}<p className="muted">กำลังโหลดข้อมูล...</p></div>;
  if (error || !book) return <div className="page">{backButton}<div className="form-error" role="alert">{error || 'ไม่พบข้อมูลหนังสือ'}</div></div>;

  const st = statusInfo(book.status);
  const canBorrow = book.status === 'available';

  const handleBorrow = async () => {
    if (!window.confirm(`ยืนยันการยืมหนังสือ "${book.title}" ?`)) return;
    setBorrowing(true);
    setMessage(null);
    try {
      const data = await api('/api/borrow', { method: 'POST', body: JSON.stringify({ book_id: book.book_id }) });
      setMessage({ type: 'ok', text: data.message });
      onBorrowed?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBorrowing(false);
      loadBook().catch(() => {}); // สถานะหนังสืออาจเปลี่ยนไปแล้ว โหลดใหม่เสมอ
    }
  };

  return (
    <div className="page">
      {backButton}

      {message && (
        <div className={message.type === 'ok' ? 'notice ok' : 'form-error'} role="status">{message.text}</div>
      )}

      <div className="detail">
        <div className="detail-cover"><BookCover book={book} /></div>

        <div className="detail-info">
          <h2>{book.title}</h2>
          <p className="detail-author">ผู้แต่ง: {book.author}</p>
          <span className="chip">หมวดหมู่: {book.category_name || 'ไม่ระบุ'}</span>

          <dl className="detail-grid">
            <dt>ISBN</dt>
            <dd>{book.isbn || '-'}</dd>
            <dt>สถานะ</dt>
            <dd><span className={`status ${st.cls}`}>{st.label}</span></dd>
          </dl>

          <button className="btn-primary detail-btn" disabled={!canBorrow || borrowing} onClick={handleBorrow}>
            {borrowing ? 'กำลังยืม...' : 'ยืมหนังสือ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;
