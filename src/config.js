// แก้ URL ของ backend ที่เดียวพอ
export const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

// ใส่ JWT ในทุก request
export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// เรียก API แล้วคืนค่า JSON ถ้าไม่สำเร็จจะ throw Error ที่มีข้อความภาษาไทยจาก backend
export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    });
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(data?.message || 'เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่');
    }
    throw new Error(data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
  }
  return data;
}

// 2025-01-24T... -> 24/01/2568 (ว่างให้แสดง -)
export function fmtDate(v) {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// วันที่แบบ YYYY-MM-DD ตามเวลาเครื่อง ใช้เทียบกับ <input type="date">
export function dayKey(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
