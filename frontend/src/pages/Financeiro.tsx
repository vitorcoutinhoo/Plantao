import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Pencil, X, Save, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { scaleService, type ConfigValor, type Feriado } from '../services/scaleService';

type Aba = 'valores' | 'feriados';

const TIPO_DIA_LABEL: Record<ConfigValor['tipo_dia'], string> = {
  UTIL: 'Dia Útil',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
  FERIADO: 'Feriado',
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const part = iso.split('T')[0];
  const [y, m, d] = part.split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
};

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* ─── ABA VALORES ─────────────────────────────────────────────────────────── */

function AbaValores() {
  const [valores, setValores] = useState<ConfigValor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    tipo_dia: 'UTIL' as ConfigValor['tipo_dia'],
    valor: '',
    descricao: '',
  });

  const [editingTipoDia, setEditingTipoDia] = useState<ConfigValor['tipo_dia'] | null>(null);
  const [editValor, setEditValor] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await scaleService.getConfigValores();
      setValores(Array.isArray(data) ? data : []);
    } catch {
      setValores([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    try {
      const descricao = form.descricao.trim();
      await scaleService.createConfigValor({
        tipo_dia: form.tipo_dia,
        valor: parseFloat(form.valor),
        ...(descricao ? { descricao } : {}),
      });
      setShowForm(false);
      setForm({ tipo_dia: 'UTIL', valor: '', descricao: '' });
      await load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar novo valor.';
        alert(`Erro: ${errorMsg}`);
      } else {
        alert('Erro interno ao tentar salvar o valor.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (v: ConfigValor) => {
    if (!editValor) {
      alert('Por favor, preencha o valor corretamente.');
      return;
    }

    setUpdating(true);
    try {
      const descricao = editDescricao.trim();
      const payload = {
        valor: parseFloat(editValor),
        ...(descricao ? { descricao } : {}),
      };

      await scaleService.updateConfigValor(v.tipo_dia, payload);
      
      setEditingTipoDia(null);
      await load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Erro desconhecido retornado pela API.';
        alert(`Falha na atualização (400): ${errorMsg}`);
      } else {
        alert('Erro interno ao atualizar o valor.');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="text-[#B5071A] animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Novo Valor</h3>
          <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Tipo de Dia</label>
            <select
              value={form.tipo_dia}
              onChange={e => setForm(f => ({ ...f, tipo_dia: e.target.value as ConfigValor['tipo_dia'] }))}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all cursor-pointer"
            >
              {Object.entries(TIPO_DIA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.valor}
              onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
              placeholder="Ex: 150.00"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Descrição (opcional)</label>
            <input
              type="text"
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Valor global para feriados"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" label="Cancelar" onClick={() => setShowForm(false)} />
            <Button
              type="submit"
              size="lg"
              disabled={creating}
              icon={creating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              label={creating ? 'Salvando...' : 'Salvar'}
            />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable<ConfigValor>
        columns={[
          { header: 'Tipo de Dia' },
          { header: 'Valor' },
          { header: 'Descrição' },
          { header: 'Ações' },
        ]}
        gridCols="grid-cols-[1fr_1fr_1.5fr_100px]"
        items={valores}
        rowKey={v => v.tipo_dia}
        emptyMessage="Nenhum valor cadastrado."
        renderRow={v => (
          <>
            <span className="text-xs font-bold text-gray-700">{TIPO_DIA_LABEL[v.tipo_dia]}</span>

            {editingTipoDia === v.tipo_dia ? (
              <input
                type="number"
                step="0.01"
                value={editValor}
                onChange={e => setEditValor(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="h-8 w-24 px-2 rounded-lg border border-[#B5071A] text-xs text-gray-700 outline-none"
              />
            ) : (
              <span className="text-xs font-bold text-[#B5071A]">{formatCurrency(v.valor)}</span>
            )}

            {editingTipoDia === v.tipo_dia ? (
              <input
                type="text"
                value={editDescricao}
                onChange={e => setEditDescricao(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Descrição (opcional)"
                className="h-8 w-full px-2 rounded-lg border border-[#B5071A] text-xs text-gray-700 outline-none"
              />
            ) : (
              <span className="text-xs text-gray-500">{v.descricao || '—'}</span>
            )}

            <div className="flex gap-2">
              {editingTipoDia === v.tipo_dia ? (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); handleUpdate(v); }}
                    disabled={updating}
                    className="text-[10px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                  >
                    {updating ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Salvar
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingTipoDia(null); }}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setEditingTipoDia(v.tipo_dia);
                    setEditValor(String(v.valor));
                    setEditDescricao(v.descricao ?? '');
                  }}
                  className="text-[10px] font-bold text-gray-400 hover:text-[#B5071A] flex items-center gap-1 transition-colors"
                >
                  <Pencil size={12} /> Editar
                </button>
              )}
            </div>
          </>
        )}
        renderMobileCard={v => (
          <>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-bold text-gray-700">{TIPO_DIA_LABEL[v.tipo_dia]}</span>
              {editingTipoDia !== v.tipo_dia && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setEditingTipoDia(v.tipo_dia);
                    setEditValor(String(v.valor));
                    setEditDescricao(v.descricao ?? '');
                  }}
                  className="text-gray-400 hover:text-[#B5071A] transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {editingTipoDia === v.tipo_dia ? (
              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="number"
                  step="0.01"
                  value={editValor}
                  onChange={e => setEditValor(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="h-9 px-3 rounded-lg border border-[#B5071A] text-sm text-gray-700 outline-none"
                  placeholder="Novo Valor"
                />
                <input
                  type="text"
                  value={editDescricao}
                  onChange={e => setEditDescricao(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="h-9 px-3 rounded-lg border border-[#B5071A] text-sm text-gray-700 outline-none"
                  placeholder="Descrição (opcional)"
                />
                <div className="flex gap-3 mt-2">
                  <button onClick={e => { e.stopPropagation(); handleUpdate(v); }} disabled={updating} className="text-[11px] font-bold text-green-600 uppercase">
                    {updating ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditingTipoDia(null); }} className="text-[11px] font-bold text-gray-400 uppercase">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-[#B5071A]">{formatCurrency(v.valor)}</p>
                <p className="text-[11px] text-gray-400 mt-1">{v.descricao || '—'}</p>
              </>
            )}
          </>
        )}
      />

      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:border-none md:p-0 md:flex md:justify-end md:gap-3">
          <Button label="Novo Valor" icon={<Plus size={14} />} onClick={() => setShowForm(true)} />
        </div>
      )}
    </div>
  );
}

/* ─── ABA FERIADOS ────────────────────────────────────────────────────────── */

function AbaFeriados() {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [editingFeriado, setEditingFeriado] = useState<Feriado | null>(null);
  const [novaData, setNovaData] = useState('');
  const [updating, setUpdating] = useState(false);

  async function load(a: number) {
    setLoading(true);
    try {
      const data = await scaleService.getFeriados(a);
      setFeriados(Array.isArray(data) ? data : []);
    } catch {
      setFeriados([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(ano); }, [ano]);

  const openEdit = (feriado: Feriado) => {
    setEditingFeriado(feriado);
    setNovaData(feriado.data.split('T')[0]);
  };

  const handleUpdate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFeriado || !novaData) return;
    setUpdating(true);
    try {
      await scaleService.updateFeriado(editingFeriado.id, novaData);
      setEditingFeriado(null);
      await load(ano);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.response?.data?.message || 'Erro ao atualizar feriado.'
        : 'Erro interno ao atualizar feriado.';
      alert(`Erro: ${errorMsg}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="text-[#B5071A] animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Seletor de ano */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAno(a => a - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-[#B5071A] hover:border-[#B5071A] transition-colors text-sm font-bold"
        >‹</button>
        <span className="text-sm font-bold text-gray-700 w-12 text-center">{ano}</span>
        <button
          onClick={() => setAno(a => a + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-[#B5071A] hover:border-[#B5071A] transition-colors text-sm font-bold"
        >›</button>
      </div>

      <DataTable<Feriado>
        columns={[
          { header: 'Nome' },
          { header: 'Data' },
          { header: 'Tipo' },
          { header: 'Ações' },
        ]}
        gridCols="grid-cols-[2fr_1fr_1fr_100px]"
        items={feriados}
        rowKey={f => f.id}
        emptyMessage={`Nenhum feriado encontrado para ${ano}.`}
        mobileClassName="pb-10"
        renderRow={f => (
          <>
            <span className="text-xs font-bold text-gray-700">{f.nome}</span>
            <span className="text-xs text-gray-500">{formatDate(f.data)}</span>
            <span className="text-xs text-gray-500">{f.descricao || '—'}</span>
            <div>
              {f.descricao === 'MUNICIPAL' && (
                <button onClick={() => openEdit(f)} className="text-[10px] font-bold text-gray-400 hover:text-[#B5071A] flex items-center gap-1 transition-colors">
                  <Pencil size={12} /> Editar
                </button>
              )}
            </div>
          </>
        )}
        renderMobileCard={f => (
          <>
            <p className="text-sm font-bold text-gray-700">{f.nome}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-gray-400">{formatDate(f.data)}</p>
              <p className="text-[11px] text-gray-400">{f.descricao || '—'}</p>
            </div>
            {f.descricao === 'MUNICIPAL' && (
              <button onClick={() => openEdit(f)} className="mt-3 text-[11px] font-bold text-[#B5071A] uppercase">Editar data</button>
            )}
          </>
        )}
      />

      {editingFeriado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleUpdate} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-base font-bold text-[#B5071A]">Editar feriado municipal</h3>
              <p className="text-xs text-gray-500 mt-1">{editingFeriado.nome}</p>
            </div>
            <input type="date" required value={novaData} onChange={e => setNovaData(e.target.value)} className="h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-[#B5071A] outline-none" />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" label="Cancelar" onClick={() => setEditingFeriado(null)} />
              <Button type="submit" disabled={updating} label={updating ? 'Salvando...' : 'Salvar'} icon={updating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────── */

export function Financeiro() {
  const [aba, setAba] = useState<Aba>('valores');

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-4xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Configuração Financeira</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Gerencie valores de plantão e feriados do sistema.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        {/* ABAS */}
        <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setAba('valores')}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
              aba === 'valores' ? 'bg-white text-[#B5071A] shadow-sm' : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
          >
            <DollarSign size={13} /> Valores
          </button>
          <button
            onClick={() => setAba('feriados')}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
              aba === 'feriados' ? 'bg-white text-[#B5071A] shadow-sm' : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
          >
            <Calendar size={13} /> Feriados
          </button>
        </div>

        {aba === 'valores' ? <AbaValores /> : <AbaFeriados />}
      </div>
    </div>
  );
}
