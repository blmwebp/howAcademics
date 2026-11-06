import { useEffect, useState, type ChangeEvent } from 'react';
import { api } from '../lib/api';
export interface Media { id: string; url?: string; originalFilename?: string; altText?: string; kind?: string }
export async function uploadImage(file: File, kind: string, altText: string): Promise<Media> {
  if (file.size > 5_000_000) throw new Error('Image must be under 5 MB');
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return api<Media>('/media', 'POST', { filename: file.name, dataBase64, kind, altText });
}
export default function MediaPage() {
  const [files, setFiles] = useState<Media[]>([]);
  const [kind, setKind] = useState('book_cover');
  const [alt, setAlt] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const refresh = () => api<Media[]>('/media').then(setFiles).catch((e) => setError(e.message));
  useEffect(() => { refresh(); }, []);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setWorking(true); setError('');
    try { await uploadImage(file, kind, alt); setAlt(''); await refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { setWorking(false); event.target.value = ''; }
  };
  return <div>
    <h1 className="text-3xl font-bold mb-2">Media library</h1>
    <p className="text-slate-500 mb-7">Only book covers and banner images are stored. Use original or licensed images.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <div className="admin-panel max-w-2xl space-y-4 mb-7">
      <label>Image type<select value={kind} onChange={(e) => setKind(e.target.value)} className="admin-input mt-1">
        <option value="book_cover">Book cover</option><option value="banner">Banner</option>
        <option value="brand_image">Brand image</option></select></label>
      <label>Alternative text<input className="admin-input mt-1" value={alt} onChange={(e) => setAlt(e.target.value)}
        placeholder="Describe the visual for accessibility"/></label>
      <label className="block font-semibold">Upload image (PNG, JPEG, WebP; max 5 MB)
        <input disabled={working} type="file" accept="image/png,image/jpeg,image/webp"
          onChange={upload} className="admin-input mt-2"/></label>
      {working && <p role="status">Uploading image…</p>}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {files.map((file) => <figure key={file.id} className="bg-white border rounded-lg p-3">
        <img src={file.url} alt={file.altText || ''} className="h-40 w-full object-contain bg-slate-100"/>
        <figcaption className="text-xs break-all mt-2 text-slate-600">{file.originalFilename || file.id}</figcaption>
      </figure>)}
    </div>
  </div>;
}
