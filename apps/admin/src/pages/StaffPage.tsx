import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
interface Role { id: string; key: string; name: string }
interface User { id: string; name: string; email: string; status: string; roles: Array<{ key: string }> }
export default function StaffPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const reload = () => api<User[]>('/staff').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => {
    reload(); api<Role[]>('/roles').then((items) => { setRoles(items);
      setRoleId(items.find((item) => item.key === 'viewer')?.id || items[0]?.id || '');
    }).catch((e) => setError(e.message));
  }, []);
  const create = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    try { await api('/staff', 'POST', { name, email, password, roleIds: [roleId] });
      setName(''); setEmail(''); setPassword(''); reload(); setMessage('Staff account created.'); }
    catch (e) { setError((e as Error).message); }
  };
  const update = async (user: User, status: string) => {
    if (!window.confirm(`Change ${user.name}'s status to ${status}?`)) return;
    const ids = roles.filter((r) => user.roles.some((u) => u.key === r.key)).map((r) => r.id);
    try { await api('/staff/' + user.id, 'PUT', { status, roleIds: ids }); reload(); }
    catch (e) { setError((e as Error).message); }
  };
  return <div className="max-w-5xl"><h1 className="text-3xl font-bold mb-2">Staff & roles</h1>
    <p className="text-slate-500 mb-7">Assign the least-privileged role required for each colleague.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {message && <p role="status" className="admin-success">{message}</p>}
    <form onSubmit={create} className="admin-panel grid md:grid-cols-2 gap-4 mb-6">
      <label>Name<input className="admin-input mt-1" required value={name} onChange={(e) => setName(e.target.value)}/></label>
      <label>Email<input className="admin-input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}/></label>
      <label>Temporary password (minimum 12 characters)<input className="admin-input mt-1" type="password" minLength={12}
        value={password} required onChange={(e) => setPassword(e.target.value)}/></label>
      <label>Role<select className="admin-input mt-1" required value={roleId} onChange={(e) => setRoleId(e.target.value)}>
        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      <div><button className="admin-button">Create staff account</button></div>
    </form>
    <div className="admin-panel"><h2 className="text-xl font-semibold mb-4">Team members</h2>
      <ul className="divide-y">{users.map((user) => <li className="py-4 flex justify-between gap-4" key={user.id}>
        <div><p className="font-semibold">{user.name}</p><p className="text-sm text-slate-500">{user.email} · {user.roles.map((r) => r.key).join(', ')} · {user.status}</p></div>
        <button onClick={() => update(user, user.status === 'active' ? 'inactive' : 'active')} className="text-blue-700 underline text-sm">
          {user.status === 'active' ? 'Disable' : 'Enable'}</button>
      </li>)}</ul>
    </div>
  </div>;
}
