import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
interface Settings { siteName?: string; footerText?: string; contactEmail?: string; contactPhone?: string;
  siteDescription?: string; headerLinks?: Array<{ label: string; url: string }> }
export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({});
  const [links, setLinks] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { api<Settings>('/settings').then((data) => {
    setForm(data); setLinks((data.headerLinks || [
      { label: 'Books', url: '/books' }, { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
    ]).map((item) => item.label + '|' + item.url).join('\n'));
  }).catch((e) => setError(e.message)); }, []);
  const set = (key: keyof Settings, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    const headerLinks = links.split('\n').map((line) => {
      const [label, url] = line.split('|').map((v) => v.trim());
      return { label, url };
    }).filter((link) => link.label && link.url);
    if (headerLinks.some((link) => !link.url.startsWith('/') || link.url.startsWith('//'))) {
      setError('Header navigation must use internal paths starting with /.'); return;
    }
    try { await api('/settings', 'PUT', { ...form, headerLinks }); setMessage('Site settings saved.'); }
    catch (e) { setError((e as Error).message); }
  };
  return <div className="max-w-3xl"><h1 className="text-3xl font-bold mb-2">Site settings</h1>
    <p className="text-slate-500 mb-7">Update the website name, navigation and footer without redeploying.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {message && <p role="status" className="admin-success">{message}</p>}
    <form onSubmit={submit} className="admin-panel space-y-5">
      {([['siteName', 'Website name'], ['siteDescription', 'Site description'],
        ['contactEmail', 'Contact email'], ['contactPhone', 'Contact phone']] as const).map(([key, label]) =>
        <label key={key} className="block">{label}<input className="admin-input mt-1" value={form[key] || ''}
          onChange={(e) => set(key, e.target.value)}/></label>)}
      <label className="block">Footer description<textarea className="admin-input mt-1" rows={3} value={form.footerText || ''}
        onChange={(e) => set('footerText', e.target.value)}/></label>
      <label className="block">Header links — one per line, in Label|/path format
        <textarea className="admin-input mt-1 font-mono text-sm" rows={5} value={links} onChange={(e) => setLinks(e.target.value)}/>
      </label>
      <button type="submit" className="admin-button">Save site settings</button>
    </form>
  </div>;
}
