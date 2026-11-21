import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type User = { id: string; username: string; role: 'admin' | 'user' };
const api = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'درخواست ناموفق بود.');
  return data;
};
function AuthShell() {
  const [ready,setReady]=useState(false),[initialized,setInitialized]=useState(true),[user,setUser]=useState<User|null>(null);
  const [mode,setMode]=useState<'login'|'setup'>('login'),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[bootstrapToken,setBootstrapToken]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [adminOpen,setAdminOpen]=useState(false),[users,setUsers]=useState<any[]>([]),[newName,setNewName]=useState(''),[newPassword,setNewPassword]=useState('');
  const refresh=async()=>{try{const status=await api('/api/auth/status');setInitialized(status.initialized);if(status.initialized){try{const me=await api('/api/auth/me');setUser(me.user);localStorage.setItem('chatbot_ui_active_user',me.user.id);}catch{setUser(null);localStorage.removeItem('chatbot_ui_active_user');}}}catch(e:any){setError(e.message);}finally{setReady(true);}};
  useEffect(()=>{refresh();},[]);
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{if(mode==='setup'){await api('/api/auth/bootstrap',{method:'POST',body:JSON.stringify({username,password,bootstrapToken})});setInitialized(true);setMode('login');setPassword('');setError('ادمین ساخته شد. اکنون وارد شوید.');}else{const r=await api('/api/auth/login',{method:'POST',body:JSON.stringify({username,password})});setUser(r.user);localStorage.setItem('chatbot_ui_active_user',r.user.id);}}catch(e:any){setError(e.message);}finally{setBusy(false);}};
  const loadUsers=async()=>{const r=await api('/api/admin/users');setUsers(r.users);};
  useEffect(()=>{if(adminOpen)loadUsers().catch(e=>setError(e.message));},[adminOpen]);
  const createUser=async(e:React.FormEvent)=>{e.preventDefault();try{await api('/api/admin/users',{method:'POST',body:JSON.stringify({username:newName,password:newPassword})});setNewName('');setNewPassword('');await loadUsers();}catch(e:any){setError(e.message);}};
  const updateUser=async(id:string,patch:any)=>{try{await api(`/api/admin/users/${id}`,{method:'PATCH',body:JSON.stringify(patch)});await loadUsers();}catch(e:any){setError(e.message);}};
  if(!ready)return <div className="h-screen grid place-items-center bg-gray-100 text-gray-600">در حال بررسی دسترسی…</div>;
  if(!user)return <div dir="rtl" className="min-h-screen grid place-items-center bg-gray-100 dark:bg-[#202123] p-5"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#303136] shadow-xl p-8 space-y-5 text-gray-900 dark:text-white">
    <div className="text-center"><div className="text-3xl mb-2">⌘</div><h1 className="text-2xl font-bold">{mode==='setup'?'راه‌اندازی ادمین اصلی':'ورود به حساب'}</h1><p className="text-sm text-gray-500 mt-2">{mode==='setup'?'اولین حساب، ادمین اصلی سامانه خواهد بود.':'برای ورود، نام کاربری و رمز عبور را وارد کنید.'}</p></div>
    <label className="block text-sm">نام کاربری<input required minLength={3} value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 w-full rounded-lg border p-3 bg-transparent" autoComplete="username"/></label>
    <label className="block text-sm">رمز عبور<input required minLength={mode==='setup'?12:1} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3 bg-transparent" autoComplete={mode==='setup'?'new-password':'current-password'}/>{mode==='setup'&&<small className="text-gray-500">حداقل ۱۲ کاراکتر</small>}</label>
    {mode==='setup'&&<label className="block text-sm">کد امن راه‌اندازی<input required type="password" value={bootstrapToken} onChange={e=>setBootstrapToken(e.target.value)} className="mt-1 w-full rounded-lg border p-3 bg-transparent"/></label>}
    {error&&<p className="text-sm text-red-500">{error}</p>}
    <button disabled={busy} className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white p-3 disabled:opacity-50">{busy?'لطفاً صبر کنید…':mode==='setup'?'ساخت ادمین':'ورود'}</button>
    {!initialized&&mode==='login'&&<button type="button" onClick={()=>{setMode('setup');setError('');}} className="w-full text-sm text-blue-600">راه‌اندازی اولیه سامانه</button>}
  </form></div>;
  return <><App/><div dir="rtl" className="fixed bottom-4 left-4 z-[100] flex gap-2"><span className="rounded-lg bg-gray-900 text-white px-3 py-2 text-xs shadow">{user.username}{user.role==='admin'?' · ادمین':''}</span>{user.role==='admin'&&<button onClick={()=>setAdminOpen(true)} className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm shadow">مدیریت کاربران</button>}<button onClick={async()=>{await api('/api/auth/logout',{method:'POST'});localStorage.removeItem('chatbot_ui_active_user');setUser(null);setMode('login');}} className="rounded-lg bg-gray-700 text-white px-3 py-2 text-sm shadow">خروج</button></div>
  {adminOpen&&<div dir="rtl" className="fixed inset-0 z-[200] bg-black/60 grid place-items-center p-4"><section className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-[#303136] text-gray-900 dark:text-white p-6 space-y-5"><div className="flex justify-between items-center"><h2 className="text-xl font-bold">مدیریت کاربران</h2><button onClick={()=>setAdminOpen(false)} className="text-2xl">×</button></div>
  <form onSubmit={createUser} className="grid sm:grid-cols-3 gap-2"><input required minLength={3} placeholder="نام کاربری" value={newName} onChange={e=>setNewName(e.target.value)} className="rounded-lg border p-2 bg-transparent"/><input required minLength={12} type="password" placeholder="رمز عبور (۱۲ کاراکتر)" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="rounded-lg border p-2 bg-transparent"/><button className="rounded-lg bg-blue-600 text-white p-2">افزودن کاربر</button></form>
  {error&&<p className="text-sm text-red-500">{error}</p>}<div className="space-y-2">{users.map(u=><div key={u.id} className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"><div><b>{u.username}</b><div className="text-xs text-gray-500">{u.role==='admin'?'ادمین':u.active?'فعال':'غیرفعال'}</div></div>{u.role==='user'&&<div className="flex gap-2"><button onClick={()=>updateUser(u.id,{active:!u.active})} className="rounded bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm">{u.active?'غیرفعال‌کردن':'فعال‌کردن'}</button><button onClick={()=>{const p=window.prompt('رمز جدید (حداقل ۱۲ کاراکتر):');if(p)updateUser(u.id,{password:p});}} className="rounded bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm">تغییر رمز</button></div>}</div>)}</div>
  </section></div>}</>;
}
createRoot(document.getElementById('root')!).render(<AuthShell/>);
