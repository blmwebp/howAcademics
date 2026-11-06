import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
interface Row { id: string; title: string; slug: string; status: string;
  authors: Array<{ name: string }>; formats: Array<{ format: string; priceMinor: number; currency: string }> }
export default function BooksPage() {
  const [books, setBooks] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api<Row[]>('/books').then(setBooks).catch((e) => setError(e.message)); }, []);
  const filtered = books.filter((b) => (b.title + ' ' + b.authors.map((a) => a.name)).toLowerCase().includes(query.toLowerCase()));
  return <div>
    <div className="flex justify-between flex-wrap gap-4 mb-7">
      <div><h1 className="text-3xl font-bold">Books</h1><p className="text-slate-500 mt-1">Manage titles, formats, authors and publication status.</p></div>
      <Link className="admin-button" to="/books/new">+ Add book</Link>
    </div>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <input value={query} onChange={(e) => setQuery(e.target.value)}
      className="admin-input mb-5 max-w-lg" aria-label="Search books" placeholder="Filter books by title or author..." />
    <div className="overflow-x-auto bg-white rounded-xl border">
      <table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600">
        <tr><th className="p-4">Title</th><th className="p-4">Authors</th><th className="p-4">Formats</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
      </thead><tbody className="divide-y">{filtered.map((book) =>
        <tr key={book.id}><td className="p-4 font-semibold">{book.title}</td>
          <td className="p-4">{book.authors.map((a) => a.name).join(', ') || '—'}</td>
          <td className="p-4">{book.formats.map((f) => f.format).join(' · ') || '—'}</td>
          <td className="p-4 capitalize">{book.status}</td>
          <td className="p-4"><Link to={`/books/${book.id}`} className="text-blue-700 underline">Edit</Link></td></tr>)}</tbody></table>
      {!filtered.length && <p className="p-8 text-center text-slate-500">No matching books. Create your first title.</p>}
    </div>
  </div>;
}
