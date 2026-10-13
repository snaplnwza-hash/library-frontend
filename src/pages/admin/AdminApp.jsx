// ตัวสลับหน้าของบรรณารักษ์ (โปรเจกต์นี้ยังไม่ใช้ react-router จึงสลับด้วย state)
import { useState } from 'react';
import '../../admin.css';
import Dashboard from './Dashboard';
import Books from './Books';
import Members from './Members';
import Loans from './Loans';
import Reports from './Reports';

const PAGES = { dash: Dashboard, books: Books, members: Members, loans: Loans, reports: Reports };

export default function AdminApp({ user, onLogout }) {
  const [page, setPage] = useState('dash');
  const Page = PAGES[page] || Dashboard;
  return <Page user={user} onLogout={onLogout} onNavigate={setPage} />;
}
