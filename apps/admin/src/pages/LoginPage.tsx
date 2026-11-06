import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Staff } from '../lib/api';
import { useAuth } from '../lib/auth';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setWorking(true);
    try { setUser(await api<Staff>('/auth/login', 'POST', { email, password })); navigate('/'); }
    catch (err) { setError((err as Error).message); }
    finally { setWorking(false); }
  };
  return <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-md">
      <p className="text-xs tracking-widest text-slate-500 uppercase">Secure administration</p>
      <h1 className="text-3xl font-bold mt-2 mb-6">HowAcademics</h1>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block">Email address<input className="admin-input mt-2" type="email" required autoComplete="username"
          value={email} onChange={(e) => setEmail(e.target.value)}/></label>
        <label className="block">Password<input className="admin-input mt-2" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}/></label>
        {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
        <button type="submit" disabled={working} className="admin-button w-full">
          {working ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-xs text-slate-500 mt-6">Create your first administrator using the documented bootstrap command. No default credentials are installed.</p>
    </div>
  </div>;
}
