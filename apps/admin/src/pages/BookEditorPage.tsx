import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

interface Ref { id: string; name: string; slug: string }
interface Media { id: string; url?: string; altText?: string }
interface Form {
  title: string; slug: string; subtitle: string; shortDescription: string; description: string;
  publicationDate: string; publisherName: string; editionLabel: string; language: string;
  pageCount: string; tableOfContents: string; coverMediaId: string; seoTitle: string; seoDescription: string;
  authorIds: string[]; categoryIds: string[]; keywords: string;
  paperback: boolean; hardcover: boolean; paperbackPrice: string; hardcoverPrice: string;
  paperbackIsbn: string; hardcoverIsbn: string;
}
const blank: Form = {
  title: '', slug: '', subtitle: '', shortDescription: '', description: '',
  publicationDate: '', publisherName: '', editionLabel: '', language: 'en',
  pageCount: '', tableOfContents: '', coverMediaId: '', seoTitle: '', seoDescription: '',
  authorIds: [], categoryIds: [], keywords: '', paperback: false, hardcover: false,
  paperbackPrice: '', hardcoverPrice: '', paperbackIsbn: '', hardcoverIsbn: '',
};
interface Existing extends Record<string, unknown> {
  id: string; status: string; formats: Array<{ format: string; priceMinor: number; isbn?: string }>;
  authorIds: string[]; categoryIds: string[]; coverMediaId?: string;
  keywords?: string[]; publicationDate?: string;
  seo?: { title?: string | null; description?: string | null };
}
export default function BookEditorPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(blank);
  const [status, setStatus] = useState('draft');
  const [authors, setAuthors] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key: keyof Form, value: Form[keyof Form]) => setForm((prior) => ({ ...prior, [key]: value }));
  useEffect(() => {
    api<Ref[]>('/authors').then(setAuthors).catch(() => undefined);
    api<Ref[]>('/categories').then(setCategories).catch(() => undefined);
    api<Media[]>('/media').then(setMedia).catch(() => undefined);
    if (id) api<Existing>('/books/' + id).then((book) => {
      const pb = book.formats.find((f) => f.format === 'paperback');
      const hc = book.formats.find((f) => f.format === 'hardcover');
      setForm({
        title: String(book.title || ''), slug: String(book.slug || ''),
        subtitle: String(book.subtitle || ''), shortDescription: String(book.shortDescription || ''),
        description: String(book.description || ''), publicationDate: book.publicationDate ? String(book.publicationDate).slice(0, 10) : '',
        publisherName: String(book.publisherName || ''), editionLabel: String(book.editionLabel || ''),
        language: String(book.language || 'en'), pageCount: book.pageCount ? String(book.pageCount) : '',
        tableOfContents: String(book.tableOfContents || ''), coverMediaId: book.coverMediaId || '',
        seoTitle: String(book.seo?.title || ''), seoDescription: String(book.seo?.description || ''),
        authorIds: book.authorIds || [], categoryIds: book.categoryIds || [],
        keywords: (book.keywords || []).join(', '), paperback: !!pb, hardcover: !!hc,
        paperbackPrice: pb ? String(pb.priceMinor / 100) : '', hardcoverPrice: hc ? String(hc.priceMinor / 100) : '',
        paperbackIsbn: pb?.isbn || '', hardcoverIsbn: hc?.isbn || '',
      });
      setStatus(book.status);
    }).catch((e) => setError(e.message));
  }, [id]);
  const toggleId = (key: 'authorIds' | 'categoryIds', value: string) =>
    set(key, form[key].includes(value) ? form[key].filter((x) => x !== value) : [...form[key], value]);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const formats = [];
      if (form.paperback) formats.push({ format: 'paperback', priceMinor: Math.round(Number(form.paperbackPrice) * 100),
        currency: 'INR', isbn: form.paperbackIsbn || null });
      if (form.hardcover) formats.push({ format: 'hardcover', priceMinor: Math.round(Number(form.hardcoverPrice) * 100),
        currency: 'INR', isbn: form.hardcoverIsbn || null });
      if (formats.some((f) => !Number.isFinite(f.priceMinor) || f.priceMinor <= 0)) throw new Error('Enter a positive price for each selected format.');
      const payload = {
        title: form.title, slug: form.slug || undefined, subtitle: form.subtitle,
        shortDescription: form.shortDescription, description: form.description,
        publicationDate: form.publicationDate || null, publisherName: form.publisherName,
        editionLabel: form.editionLabel, language: form.language, pageCount: form.pageCount ? Number(form.pageCount) : null,
        tableOfContents: form.tableOfContents, coverMediaId: form.coverMediaId || null,
        seoTitle: form.seoTitle, seoDescription: form.seoDescription,
        authorIds: form.authorIds, categoryIds: form.categoryIds,
        keywords: form.keywords.split(',').map((x) => x.trim()).filter(Boolean), formats,
      };
      const saved = await api<{ id: string }>('/books' + (id ? '/' + id : ''), id ? 'PUT' : 'POST', payload);
      setMessage('Book saved successfully. Publish when ready.');
      if (!id) navigate('/books/' + saved.id);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };
  const publish = async (action: 'publish' | 'unpublish') => {
    if (!id) return;
    setError(''); setMessage('');
    try { await api('/books/' + id + '/' + action, 'POST'); setStatus(action === 'publish' ? 'published' : 'draft');
      setMessage(action === 'publish' ? 'Book is published.' : 'Book returned to draft.'); }
    catch (err) { setError((err as Error).message); }
  };
  const section = (title: string, children: React.ReactNode) => <section className="admin-panel space-y-4">
    <h2 className="text-xl font-semibold border-b pb-3">{title}</h2>{children}</section>;
  return <div className="max-w-5xl space-y-6">
    <div className="flex justify-between gap-3 flex-wrap"><div><Link to="/books" className="text-blue-700 underline text-sm">← All books</Link>
      <h1 className="text-3xl font-bold mt-2">{id ? 'Edit book' : 'Add a book'}</h1>
      <p className="capitalize text-slate-500 mt-1">Status: {status}</p></div>
      {id && <div className="flex gap-2 items-start">
        <a className="admin-button-secondary" href={`/api/v1/admin/books/${id}/flyer-preview`} target="_blank" rel="noopener noreferrer">Preview flyer</a>
        <button className="admin-button-secondary" onClick={() => publish(status === 'published' ? 'unpublish' : 'publish')}>
          {status === 'published' ? 'Unpublish' : 'Publish'}</button></div>}
    </div>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {message && <p role="status" className="admin-success">{message}</p>}
    <form onSubmit={save} className="space-y-6">
      {section('Basic book details', <div className="grid md:grid-cols-2 gap-4">
        <label>Book title *<input className="admin-input mt-1" required value={form.title} onChange={(e) => set('title', e.target.value)}/></label>
        <label>URL slug<input className="admin-input mt-1" value={form.slug} placeholder="Generated from title if empty" onChange={(e) => set('slug', e.target.value)}/></label>
        <label>Subtitle<input className="admin-input mt-1" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)}/></label>
        <label>Publication date<input className="admin-input mt-1" type="date" value={form.publicationDate} onChange={(e) => set('publicationDate', e.target.value)}/></label>
        <label>Publisher<input className="admin-input mt-1" value={form.publisherName} onChange={(e) => set('publisherName', e.target.value)}/></label>
        <label>Edition label<input className="admin-input mt-1" value={form.editionLabel} onChange={(e) => set('editionLabel', e.target.value)}/></label>
        <label>Language code<input className="admin-input mt-1" value={form.language} onChange={(e) => set('language', e.target.value)}/></label>
        <label>Page count<input className="admin-input mt-1" type="number" min="1" value={form.pageCount} onChange={(e) => set('pageCount', e.target.value)}/></label>
        <label className="md:col-span-2">Short description<textarea className="admin-input mt-1" rows={3} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)}/></label>
        <label className="md:col-span-2">Complete description<textarea className="admin-input mt-1" rows={7} value={form.description} onChange={(e) => set('description', e.target.value)}/></label>
        <label className="md:col-span-2">Table of contents<textarea className="admin-input mt-1" rows={4} value={form.tableOfContents} onChange={(e) => set('tableOfContents', e.target.value)}/></label>
      </div>)}
      {section('Authors (names only)', <div className="grid sm:grid-cols-2 gap-2">
        {authors.map((author) => <label className="flex items-center gap-2" key={author.id}>
          <input type="checkbox" checked={form.authorIds.includes(author.id)} onChange={() => toggleId('authorIds', author.id)}/>{author.name}</label>)}
        {!authors.length && <p className="text-slate-500">Create authors first using the Authors page.</p>}
      </div>)}
      {section('Categories', <div className="grid sm:grid-cols-2 gap-2">
        {categories.map((category) => <label className="flex items-center gap-2" key={category.id}>
          <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => toggleId('categoryIds', category.id)}/>{category.name}</label>)}
        {!categories.length && <p className="text-slate-500">Create categories first using the Categories page.</p>}
        <label className="sm:col-span-2 mt-4">Keywords (comma separated)<input className="admin-input mt-1" value={form.keywords} onChange={(e) => set('keywords', e.target.value)}/></label>
      </div>)}
      {section('Formats & prices', <div className="space-y-5">
        <p className="text-slate-500 text-sm">Select neither, one, or both. The website shows only selected formats and their prices.</p>
        {(['paperback', 'hardcover'] as const).map((kind) => {
          const enabled = form[kind];
          const priceKey = kind === 'paperback' ? 'paperbackPrice' : 'hardcoverPrice';
          const isbnKey = kind === 'paperback' ? 'paperbackIsbn' : 'hardcoverIsbn';
          return <div key={kind} className="p-4 border rounded-lg">
            <label className="font-semibold flex gap-2 items-center capitalize">
              <input type="checkbox" checked={enabled} onChange={(e) => set(kind, e.target.checked)}/>{kind}</label>
            {enabled && <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <label>Price (₹) *<input required type="number" min=".01" step=".01" className="admin-input mt-1" value={form[priceKey]}
                onChange={(e) => set(priceKey, e.target.value)}/></label>
              <label>ISBN (optional)<input className="admin-input mt-1" value={form[isbnKey]} onChange={(e) => set(isbnKey, e.target.value)}/></label>
            </div>}
          </div>;
        })}
      </div>)}
      {section('Cover & search', <div className="space-y-4">
        <label>Book cover image<select className="admin-input mt-1" value={form.coverMediaId} onChange={(e) => set('coverMediaId', e.target.value)}>
          <option value="">No cover selected</option>
          {media.map((asset) => <option key={asset.id} value={asset.id}>{asset.altText || asset.id}</option>)}
        </select></label>
        <p className="text-sm">Upload covers from <Link to="/media" className="text-blue-700 underline">Media library</Link>.</p>
        <label>SEO title<input className="admin-input mt-1" value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)}/></label>
        <label>SEO description<textarea className="admin-input mt-1" rows={2} value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)}/></label>
      </div>)}
      <div className="sticky bottom-0 bg-white/95 border p-4 rounded-xl flex justify-end">
        <button className="admin-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save book'}</button>
      </div>
    </form>
  </div>;
}
