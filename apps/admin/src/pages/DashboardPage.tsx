import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
interface Dashboard { totalBooks: number; publishedBooks: number; draftBooks: number; totalAuthors: number; totalCategories: number;
  activeHomepageSections: number; activeBanners: number; recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string; actorName: string }> }
export default function DashboardPage() {
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<Dashboard>('/dashboard').then(setStats).catch((e) => setError(e.message)); }, []);
  const fields: Array<[string, keyof Dashboard]> = [
    ['Total books', 'totalBooks'], ['Published books', 'publishedBooks'],
    ['Draft books', 'draftBooks'], ['Authors', 'totalAuthors'],
    ['Categories', 'totalCategories'], ['Homepage sections', 'activeHomepageSections'], ['Banners', 'activeBanners'],
  ];
  return <div>
    <div className="flex flex-wrap justify-between gap-4 items-start mb-8"><div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-slate-500 mt-1">Your HowAcademics catalogue at a glance</p></div>
      <Link to="/books/new" className="admin-button">+ Add book</Link></div>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">{fields.map(([label, key]) =>
      <div className="bg-white rounded-xl border border-slate-200 p-6" key={key}>
        <p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-bold mt-2">{stats ? String(stats[key]) : '—'}</p></div>)}</div>
    <div className="bg-white rounded-xl border p-6"><h2 className="text-xl font-semibold mb-4">Recent activity</h2>
      {!stats?.recentActivity.length ? <p className="text-slate-500">No changes recorded yet.</p> :
        <ul className="divide-y">{stats.recentActivity.map((log) =>
          <li key={log.id} className="py-3 text-sm">{log.actorName} · {log.action} {log.entityType}
            <span className="float-right text-slate-400">{new Date(log.createdAt).toLocaleString()}</span></li>)}</ul>}
    </div>
  </div>;
}
