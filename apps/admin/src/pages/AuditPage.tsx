import { useEffect, useState } from 'react';
import { api } from '../lib/api';
interface Log { id: string; action: string; entityType: string; entityId?: string; createdAt: string; actorId?: string }
export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { api<Log[]>('/audit').then(setLogs).catch((e) => setError(e.message)); }, []);
  return <div><h1 className="text-3xl font-bold mb-2">Audit log</h1>
    <p className="text-slate-500 mb-7">Recent administrative activity for accountability.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <div className="admin-panel overflow-x-auto"><table className="w-full text-sm text-left"><thead>
      <tr><th className="p-3">Date</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Staff ID</th></tr>
    </thead><tbody className="divide-y">{logs.map((log) => <tr key={log.id}>
      <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td><td className="p-3">{log.action}</td>
      <td className="p-3">{log.entityType}</td><td className="p-3 text-slate-500">{log.actorId || 'system'}</td>
    </tr>)}</tbody></table></div>
  </div>;
}
