import React, { useState } from 'react';

interface Props {
  onCreate: (email: string, name: string, role: 'USER'|'ADMIN', masterKey?: string) => Promise<void>;
  canCreateAdmin: boolean;
}
export const CreateUserForm: React.FC<Props> = ({ onCreate, canCreateAdmin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'USER'|'ADMIN'>('USER');
  const [masterKey, setMasterKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await onCreate(email, name, role, role === 'ADMIN' ? masterKey : undefined);
      setEmail(''); setName(''); setRole('USER'); setMasterKey('');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Falha ao criar');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-3 items-end bg-gray-50 p-4 rounded border">
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold mb-1">Email</label>
        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Nome</label>
        <input required value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Role</label>
        <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full border rounded px-2 py-1">
          <option value="USER">USER</option>
          {canCreateAdmin && <option value="ADMIN">ADMIN</option>}
        </select>
      </div>
      {role === 'ADMIN' && canCreateAdmin && (
        <div>
          <label className="block text-xs font-semibold mb-1">Master Key</label>
          <input required value={masterKey} onChange={e=>setMasterKey(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
      )}
      <div className="md:col-span-5 flex gap-2">
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">{loading ? 'Criando...' : 'Criar Usuário'}</button>
      </div>
      {error && <div className="md:col-span-5 text-xs text-red-600">{error}</div>}
    </form>
  );
};
