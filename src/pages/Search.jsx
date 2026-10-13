import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import BookCover, { statusInfo } from '../components/BookCover';
import { API, authHeaders } from '../config';

// searchTerm ถูกเก็บไว้ที่ Home เพื่อให้กดกลับมาแล้วคำค้นยังอยู่
function Search({ searchTerm, onSearchTermChange, onViewBook }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/books`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('โหลดรายการหนังสือไม่สำเร็จ');
        return res.json();
      })
      .then((data) => setBooks(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'))
      .finally(() => setLoading(false));
  }, []);

  const term = searchTerm.trim().toLowerCase();
  const filteredBooks = books.filter((b) =>
    [b.title, b.author, b.isbn, b.category_name].some((v) => (v || '').toLowerCase().includes(term))
  );

  return (
    <div className="page">
      <h2 className="page-title">ค้นหาหนังสือ</h2>

      <div className="search-bar">
        <Icon name="search" size={16} />
        <input
          type="text"
          placeholder="ค้นหาจากชื่อเรื่อง ผู้แต่ง ISBN หรือหมวดหมู่..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      {loading && <p className="muted">กำลังโหลดข้อมูล...</p>}
      {error && <div className="form-error" role="alert">{error}</div>}
      {!loading && !error && filteredBooks.length === 0 && (
        <p className="muted">ไม่พบหนังสือที่ค้นหา</p>
      )}

      <div className="book-grid">
        {filteredBooks.map((book) => {
          const st = statusInfo(book.status);
          return (
            <article className="book-card" key={book.book_id}>
              <BookCover book={book} />
              <h4>{book.title}</h4>
              <p>{book.author}</p>
              <span className={`status ${st.cls}`}>{st.label}</span>
              <button className="btn-primary sm" onClick={() => onViewBook(book.book_id)}>
                ดูรายละเอียด
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default Search;
