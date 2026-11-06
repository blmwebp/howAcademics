import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
type Resource = 'authors' | 'categories' | 'synonyms';
interface Item { id: string; name?: string; slug?: string; canonicalTerm?: string; alternativeTerm?: string; isActive?: boolean }
export default function ResourcesPage({ resource }: { resource: Resource }) {
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [alternate, setAlternate] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const reload = () => api<Item[]>('/' + resource).then(setItems).catch((e) => setError(e.message));
  useEffect(() => { setEditing(null); setName(''); setSlug(''); setAlternate(''); reload(); }, [resource]);
  const select = (item: Item) => {
    setEditing(item.id); setName(item.name || item.canonicalTerm || '');
    setSlug(item.slug || ''); setAlternate(item.alternativeTerm || '');
  };
  const reset = () => { setEditing(null); setName(''); setSlug(''); setAlternate(''); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const body = resource === 'synonyms'
        ? { canonicalTerm: name, alternativeTerm: alternate, isActive: true }
        : { name, slug: slug || undefined, ...(resource === 'categories' && { isActive: true }) };
      await api('/' + resource + (editing ? '/' + editing : ''), editing ? 'PUT' : 'POST', body);
      setMessage('Saved successfully.'); reset(); reload();
    } catch (e) { setError((e as Error).message); }
  };
  const remove = async (item: Item) => {
    if (!window.confirm('Delete this record? Assigned records cannot be deleted.')) return;
    try { await api('/' + resource + '/' + item.id, 'DELETE'); reload(); }
    catch (e) { setError((e as Error).message); }
  };
  const label = resource === 'synonyms' ? 'Search synonyms' : resource === 'authors' ? 'Authors' : 'Categories';
  return <div className="max-w-5xl">
    <h1 className="text-3xl font-bold">{label}</h1>
    <p className="text-slate-500 mt-2 mb-7">{resource === 'authors'
      ? 'Store author names only. Public clicks filter books—no author profile is created.'
      : resource === 'categories' ? 'Organize book subjects and select them for homepage shelves.'
        : 'Define related search terms, for example AI and Artificial Intelligence.'}</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {message && <p role="status" className="admin-success">{message}</p>}
    <form onSubmit={save} className="admin-panel grid md:grid-cols-2 gap-4 mb-6">
      <label>{resource === 'synonyms' ? 'Canonical term' : 'Name'}<input required className="admin-input mt-1" value={name}
        onChange={(e) => setName(e.target.value)} /></label>
      {resource === 'synonyms' ? <label>Alternative term<input className="admin-input mt-1" value={alternate} required
        onChange={(e) => setAlternate(e.target.value)}/></label>
        : <label>Slug (optional)<input className="admin-input mt-1" value={slug} placeholder="Generated from name"
          onChange={(e) => setSlug(e.target.value)}/></label>}
      <div className="md:col-span-2 flex gap-3">
        <button className="admin-button" type="submit">{editing ? 'Update' : 'Add'} {label.toLowerCase()}</button>
        {editing && <button className="admin-button-secondary" type="button" onClick={reset}>Cancel</button>}
      </div>
    </form>
    <div className="admin-panel">
      <h2 className="text-xl font-semibold mb-4">Existing entries ({items.length})</h2>
      {!items.length && <p className="text-slate-500">No entries yet.</p>}
      <ul className="divide-y">{items.map((item) => <li key={item.id} className="flex justify-between gap-3 items-center py-3">
        <div><p className="font-semibold">{item.name || item.canonicalTerm}</p>
          <p className="text-xs text-slate-500">{item.alternativeTerm || item.slug}</p></div>
        <div className="flex gap-3 text-sm"><button className="text-blue-700 underline" onClick={() => select(item)}>Edit</button>
          <button className="text-red-700 underline" onClick={() => remove(item)}>Delete</button></div></li>)}</ul>
    </div>
  </div>;
}
