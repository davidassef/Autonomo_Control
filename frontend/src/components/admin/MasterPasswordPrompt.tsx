import React, { useState } from 'react';

interface Props {
  title: string;
  onConfirm: (masterKey: string) => Promise<void> | void;
  onClose: () => void;
}
export const MasterPasswordPrompt: React.FC<Props> = ({ title, onConfirm, onClose }) => {
  const [masterKey, setMasterKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await onConfirm(masterKey);
      onClose();
      setMasterKey('');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail === 'Master password inválida') {
        setError('Master password inválida');
      } else if (e?.response?.status === 403) {
        setError(detail || 'Ação não permitida');
      } else {
        setError(detail || 'Erro inesperado');
      }
      setMasterKey('');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-md p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Master Password</label>
            <input autoFocus type="password" value={masterKey} onChange={e=>setMasterKey(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3 py-1 text-xs border rounded" disabled={loading}>Cancelar</button>
            <button type="submit" disabled={!masterKey || loading} className="px-3 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Validando...' : 'Confirmar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
