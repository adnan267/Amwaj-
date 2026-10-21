import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageTitle, Card, Field, Badge, useToast, useConfirm, timeAgo } from './ui.jsx';
import { useAuth } from './AdminApp.jsx';

export default function Team() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [nu, setNu] = useState({ name: '', email: '', password: '', role: 'editor' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const isAdmin = user.role === 'admin';

  useEffect(() => { if (isAdmin) api.get('/users').then(setUsers, (e) => toast(e.message, 'err')); }, [isAdmin, toast]);

  const add = async (e) => {
    e.preventDefault();
    try { const u = await api.post('/users', nu); setUsers((x) => [...x, u]); setNu({ name: '', email: '', password: '', role: 'editor' }); toast(`${u.name} can now sign in`); }
    catch (e2) { toast(e2.message, 'err'); }
  };
  const remove = async (u) => {
    if (!(await confirm({ title: `Remove ${u.name}?`, text: 'They will no longer be able to sign in to the dashboard.', action: 'Remove', danger: true }))) return;
    try { await api.del(`/users/${u._id}`); setUsers((x) => x.filter((y) => y._id !== u._id)); toast(`${u.name} removed`); } catch (e) { toast(e.message, 'err'); }
  };
  const changePw = async (e) => {
    e.preventDefault();
    try { await api.put('/auth/password', pw); setPw({ current: '', next: '' }); toast('Password changed'); } catch (e2) { toast(e2.message, 'err'); }
  };

  return (
    <>
      <PageTitle title="Team & account" text="Who can sign in to this dashboard." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {isAdmin && (
            <Card className="!p-0">
              <h2 className="p-6 pb-2 text-lg font-bold">Team members</h2>
              <ul className="divide-y divide-line">
                {users.map((u) => (
                  <li key={u._id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0"><p className="font-semibold">{u.name} {String(u._id) === String(user.id) && <span className="text-sm font-normal text-mute">(you)</span>}</p><p className="truncate text-sm text-mute">{u.email}{u.lastLoginAt ? `, last signed in ${timeAgo(u.lastLoginAt)}` : ''}</p></div>
                    <div className="flex items-center gap-3"><Badge tone={u.role === 'admin' ? 'navy' : 'gray'}>{u.role === 'admin' ? 'Admin' : 'Editor'}</Badge>
                      {String(u._id) !== String(user.id) && <button onClick={() => remove(u)} className="rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${u.name}`}><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {isAdmin && (
            <Card>
              <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
                <h2 className="text-lg font-bold sm:col-span-2">Add a team member</h2>
                <Field label="Name"><input className="input" required value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} /></Field>
                <Field label="Email"><input className="input" type="email" required value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} /></Field>
                <Field label="Temporary password" hint="At least 8 characters. Ask them to change it."><input className="input" type="text" required minLength={8} value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} /></Field>
                <Field label="Access" hint="Editors manage content and enquiries. Admins also manage the team.">
                  <select className="input" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}><option value="editor">Editor</option><option value="admin">Admin</option></select>
                </Field>
                <div className="sm:col-span-2"><button className="btn-dark !py-2.5">Add team member</button></div>
              </form>
            </Card>
          )}
        </div>
        <Card>
          <form onSubmit={changePw} className="space-y-4">
            <h2 className="text-lg font-bold">Change your password</h2>
            <Field label="Current password"><input className="input" type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
            <Field label="New password" hint="At least 8 characters"><input className="input" type="password" autoComplete="new-password" required minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
            <button className="btn-dark !py-2.5">Change password</button>
          </form>
        </Card>
      </div>
    </>
  );
}
