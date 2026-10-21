import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { scaleService, type Cargo, type Setor } from '../services/scaleService';

type Aba = 'cargos' | 'setores';

function Lista<T extends { id: string; nome: string }>({
  items, loading, onDelete, deleting, label,
}: {
  items: T[];
  loading: boolean;
  onDelete: (id: string, nome: string) => void;
  deleting: string | null;
  label: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="text-[#B5071A] animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      {items.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">Nenhum {label.toLowerCase()} cadastrado.</p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-bold text-gray-700">{item.nome}</span>
              <button
                onClick={() => onDelete(item.id, item.nome)}
                disabled={deleting === item.id}
                className="text-gray-300 hover:text-[#B5071A] transition-colors disabled:opacity-30"
              >
                {deleting === item.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Trash2 size={14} />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CargosSetores() {
  const [aba, setAba] = useState<Aba>('cargos');
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(true);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    scaleService.getCargos()
      .then(data => setCargos(Array.isArray(data) ? data : []))
      .catch(() => setCargos([]))
      .finally(() => setLoadingCargos(false));
    scaleService.getSetores()
      .then(data => setSetores(Array.isArray(data) ? data : []))
      .catch(() => setSetores([]))
      .finally(() => setLoadingSetores(false));
  }, []);

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    setSaving(true);
    try {
      if (aba === 'cargos') {
        const novo = await scaleService.createCargo(nome);
        setCargos(prev => [...prev, novo]);
      } else {
        const novo = await scaleService.createSetor(nome);
        setSetores(prev => [...prev, novo]);
      }
      setNovoNome('');
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao adicionar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    const label = aba === 'cargos' ? 'cargo' : 'setor';
    if (!confirm(`Excluir ${label} "${nome}"?`)) return;
    setDeletingId(id);
    try {
      if (aba === 'cargos') {
        await scaleService.deleteCargo(id);
        setCargos(prev => prev.filter(c => c.id !== id));
      } else {
        await scaleService.deleteSetor(id);
        setSetores(prev => prev.filter(s => s.id !== id));
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao excluir.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-2xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Cargos e Setores</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Gerencie os cargos e setores disponíveis no sistema.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full flex-grow flex flex-col gap-6">
        {/* ABAS */}
        <div className="flex gap-1 bg-gray-50 p-1 rounded-xl w-fit">
          {(['cargos', 'setores'] as Aba[]).map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={[
                'px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
                aba === a ? 'bg-white text-[#B5071A] shadow-sm' : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {a === 'cargos' ? 'Cargos' : 'Setores'}
            </button>
          ))}
        </div>

        {/* FORMULÁRIO ADICIONAR */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder={`Nome do ${aba === 'cargos' ? 'cargo' : 'setor'}...`}
            className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
          />
          <Button
            type="submit"
            disabled={saving || !novoNome.trim()}
            icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            label={saving ? 'Salvando...' : 'Adicionar'}
          />
        </form>

        {/* LISTA */}
        {aba === 'cargos' ? (
          <Lista
            items={cargos}
            loading={loadingCargos}
            onDelete={handleDelete}
            deleting={deletingId}
            label="Cargo"
          />
        ) : (
          <Lista
            items={setores}
            loading={loadingSetores}
            onDelete={handleDelete}
            deleting={deletingId}
            label="Setor"
          />
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 10px; }
      `}</style>
    </div>
  );
}
