// ฟังก์ชันช่วยเหลือที่ใช้ร่วมกันในหน้า Admin
import { useState, useCallback, useRef, useEffect } from 'react';

// บนเว็บจริงตั้ง VITE_API_URL (ที่อยู่ backend) ในหน้าตั้งค่าของ Vercel ส่วนในเครื่องใช้ localhost
const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // token หมดอายุ: ล้างข้อมูลแล้วโหลดใหม่ ระบบจะกลับไปหน้า Login เอง
    if (data.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    throw new Error(data.message || 'เกิดข้อผิดพลาด');
  }
  return data;
}

// ค่าในฐานข้อมูล (enum book_status) -> ข้อความที่แสดง
export const BOOK_STATUS = {
  available: 'พร้อมให้ยืม',
  borrowed: 'ถูกยืม',
  maintenance: 'ซ่อมบำรุง',
};

export function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// วันที่รูปแบบ YYYY-MM-DD ตามเวลาท้องถิ่น (ไม่ใช้ toISOString เพราะจะเพี้ยนวันตอนเช้ามืดของไทย)
export function toISO(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ส่งออก CSV (ใส่ BOM ให้ Excel อ่านภาษาไทยได้ และกันสูตรใน Excel ด้วยการนำหน้า ' )
export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.map(esc).join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// [msg, run] — run(fn, ข้อความสำเร็จสำรอง) เรียก fn แล้วแสดงข้อความ
// ถ้า fn คืน object ที่มี message (จาก API) จะใช้ข้อความนั้นก่อน
// คืน true เมื่อสำเร็จ false เมื่อผิดพลาด
export function useNotice() {
  const [msg, setMsg] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((type, text) => {
    clearTimeout(timer.current);
    setMsg({ type, text });
    if (type === 'ok') timer.current = setTimeout(() => setMsg(null), 5000);
  }, []);

  const run = useCallback(async (fn, okText) => {
    try {
      const result = await fn();
      const text = (result && result.message) || okText;
      if (text) show('ok', text);
      return true;
    } catch (err) {
      show('err', err.message || 'เกิดข้อผิดพลาด');
      return false;
    }
  }, [show]);

  return [msg, run];
}
