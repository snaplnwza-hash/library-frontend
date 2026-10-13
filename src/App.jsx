import { useState } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminApp from './pages/admin/AdminApp';
import './App.css';

function loadUser() {
  try {
    return localStorage.getItem('token') ? JSON.parse(localStorage.getItem('user')) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(loadUser);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;
  // บรรณารักษ์เข้าหน้า Admin ส่วนสมาชิกทั่วไปเข้าหน้า Home เดิม
  // (การป้องกันจริงอยู่ที่ฝั่ง server — /api/admin ตรวจสิทธิ์ทุกครั้ง)
  return user.role === 'admin'
    ? <AdminApp user={user} onLogout={logout} />
    : <Home user={user} onLogout={logout} />;
}
