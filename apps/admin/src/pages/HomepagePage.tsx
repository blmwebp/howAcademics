import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
interface Category { id: string; name: string }
interface Book { id: string; title: string; categories: Array<{ id: string }> }
interface Section { id: string; categoryId: string; category: Category; titleOverride: string | null;
  isEnabled: boolean; sortOrder: number; maxBooks: number; sortMode: string;
  sectionBooks: Array<{ bookId: string }> }
export default function HomepagePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(8);
  const [sortMode, setSortMode] = useState('newest');
  const [enabled, setEnabled] = useState(true);
  const [bookIds, setBookIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const reload = () => api<Section[]>('/homepage-sections').then(setSections).catch((e) => setError(e.message));
  useEffect(() => {
    api<Category[]>('/categories').then((items) => { setCategories(items); if (items.length) setCategoryId(items[0].id); }).catch(() => undefined);
    api<Book[]>('/books').then(setBooks).catch(() => undefined);
    reload();
  }, []);
  const edit = (item: Section) => {
    setEditing(item.id); setCategoryId(item.categoryId); setTitle(item.titleOverride || '');
    setCount(item.maxBooks); setSortMode(item.sortMode); setEnabled(item.isEnabled);
    setBookIds(item.sectionBooks.map((b) => b.bookId));
  };
  const clear = () => { setEditing(null); setTitle(''); setCount(8); setSortMode('newest'); setEnabled(true); setBookIds([]); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await api('/homepage-sections' + (editing ? '/' + editing : ''), editing ? 'PUT' : 'POST', {
        categoryId, titleOverride: title || null, maxBooks: count, sortMode,
        isEnabled: enabled, sortOrder: editing ? sections.find((x) => x.id === editing)?.sortOrder : sections.length,
        bookIds,
      });
      setMessage('Homepage category section saved.'); clear(); reload();
    } catch (e) { setError((e as Error).message); }
  };
  const move = async (item: Section, direction: number) => {
    const index = sections.findIndex((x) => x.id === item.id);
    const other = sections[index + direction];
    if (!other) return;
    const payload = (s: Section, order: number) => ({
      categoryId: s.categoryId, titleOverride: s.titleOverride, isEnabled: s.isEnabled,
      maxBooks: s.maxBooks, sortMode: s.sortMode, sortOrder: order, bookIds: s.sectionBooks.map((b) => b.bookId),
    });
    try {
      await api('/homepage-sections/' + item.id, 'PUT', payload(item, other.sortOrder));
      await api('/homepage-sections/' + other.id, 'PUT', payload(other, item.sortOrder));
      reload();
    } catch (e) { setError((e as Error).message); }
  };
  return <div className="max-w-5xl">
    <h1 className="text-3xl font-bold mb-2">Homepage categories</h1>
    <p className="text-slate-500 mb-7">Control exactly which subject rows appear below the banner and in what order.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {message && <p className="admin-success" role="status">{message}</p>}
    <form onSubmit={save} className="admin-panel grid md:grid-cols-2 gap-4 mb-6">
      <label>Category *<select className="admin-input mt-1" value={categoryId} required onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label>Section heading override<input className="admin-input mt-1" value={title}
        onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to category name"/></label>
      <label>Number of books<input className="admin-input mt-1" type="number" min="1" max="40" value={count}
        onChange={(e) => setCount(Number(e.target.value))}/></label>
      <label>Sorting<select className="admin-input mt-1" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
        <option value="newest">Newest first</option><option value="title_asc">Title A–Z</option>
        <option value="title_desc">Title Z–A</option><option value="manual">Manually selected books</option>
      </select></label>
      {sortMode === 'manual' && <fieldset className="md:col-span-2 border rounded p-3">
        <legend className="font-semibold">Select books in this category</legend>
        <div className="grid md:grid-cols-2 gap-2 mt-3">{books.filter((b) => b.categories.some((c) => c.id === categoryId)).map((b) =>
          <label key={b.id}><input type="checkbox" checked={bookIds.includes(b.id)} onChange={(e) => setBookIds(
            e.target.checked ? [...bookIds, b.id] : bookIds.filter((v) => v !== b.id))}/> {b.title}</label>)}</div>
      </fieldset>}
      <label className="flex gap-2 items-center"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}/> Enabled on website</label>
      <div className="md:col-span-2 flex gap-3"><button className="admin-button">{editing ? 'Update section' : 'Add category section'}</button>
        {editing && <button type="button" className="admin-button-secondary" onClick={clear}>Cancel</button>}</div>
    </form>
    <div className="admin-panel">
      <h2 className="text-xl font-semibold mb-4">Homepage order</h2>
      {!sections.length && <p className="text-slate-500">No published sections yet. Add a category above.</p>}
      <ul className="divide-y">{sections.map((s) => <li key={s.id} className="flex justify-between flex-wrap gap-3 py-4 items-center">
        <div><p className="font-semibold">{s.titleOverride || s.category.name}</p>
          <p className="text-sm text-slate-500">{s.isEnabled ? 'Visible' : 'Hidden'} · {s.maxBooks} books · {s.sortMode}</p></div>
        <div className="flex gap-2">
          <button className="admin-button-secondary" onClick={() => move(s, -1)} aria-label="Move section up">↑</button>
          <button className="admin-button-secondary" onClick={() => move(s, 1)} aria-label="Move section down">↓</button>
          <button className="admin-button-secondary" onClick={() => edit(s)}>Edit</button>
          <button className="admin-button-secondary" onClick={async () => {
            if (window.confirm('Remove this homepage section?')) {
              await api('/homepage-sections/' + s.id, 'DELETE'); reload();
            }
          }}>Remove</button>
        </div>
      </li>)}</ul>
    </div>
  </div>;
}
