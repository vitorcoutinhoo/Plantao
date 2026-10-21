import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, RefreshCw, Mail, Clock, CheckCircle, RotateCcw, Plus, X, Ban } from 'lucide-react';
import { conviteService, type Convite } from '../services/conviteService';
import { collaboratorService, type Collaborator } from '../services/collaboratorService';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { isExpirado, isRevogado } from '../utils/conviteStatus';

interface ConviteRow extends Convite {
  nomeColaborador: string;
  emailColaborador: string;
}

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export function Convites() {
  const navigate = useNavigate();
  const [convites, setConvites] = useState<ConviteRow[]>([]);
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([]); // Armazena a lista para o novo convite
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [sending, setSending] = useState(false); // Estado de loading do novo convite
  const [selected, setSelected] = useState<ConviteRow | null>(null);
  
  // Estados para controle do formulário de envio
  const [showForm, setShowForm] = useState(false);
  const [selectedColabId, setSelectedColabId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [lista, listaColaboradores] = await Promise.all([
        conviteService.listar(),
        collaboratorService.getAll(),
      ]);
      
      // Filtra apenas colaboradores ativos para poder enviar novos convites
      setColaboradores(listaColaboradores.filter(c => c.status === 'ativo'));

      const colabMap: Record<string, { nome: string; email: string }> = {};
      listaColaboradores.forEach(c => { colabMap[c.id] = { nome: c.nome, email: c.email }; });
      
      const convitesComNome = lista.map(cv => ({
        ...cv,
        nomeColaborador: colabMap[cv.id_colaborador]?.nome ?? '—',
        emailColaborador: colabMap[cv.id_colaborador]?.email ?? '',
      }));
      convitesComNome.sort((a, b) => {
        const aRevogado = isRevogado(a.expira_em, a.usado);
        const bRevogado = isRevogado(b.expira_em, b.usado);
        return aRevogado === bRevogado ? 0 : aRevogado ? 1 : -1;
      });
      setConvites(convitesComNome);
    } catch {
      alert('Erro ao carregar convites.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleRevogar = async (cv: ConviteRow) => {
    if (!confirm(`Revogar convite de ${cv.nomeColaborador}?`)) return;
    setRevoking(cv.token);
    try {
      await conviteService.deletar(cv.token);
      setConvites(prev => prev.filter(c => c.token !== cv.token));
      if (selected?.token === cv.token) setSelected(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao revogar convite.');
    } finally {
      setRevoking(null);
    }
  };

  const handleReenviar = async (cv: ConviteRow) => {
    if (!confirm(`Reenviar convite para ${cv.nomeColaborador}?`)) return;
    setResending(cv.token);
    try {
      await conviteService.deletar(cv.token);
      await conviteService.criar(cv.id_colaborador, cv.emailColaborador, cv.nomeColaborador);
      await load();
      setSelected(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao reenviar convite.');
    } finally {
      setResending(null);
    }
  };

  // Função para processar o envio do novo convite
  const handleEnviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColabId) return;

    const colab = colaboradores.find(c => c.id === selectedColabId);
    if (!colab) return;

    setSending(true);
    try {
      await conviteService.criar(colab.id, colab.email, colab.nome);
      alert('Convite enviado com sucesso!');
      setShowForm(false);
      setSelectedColabId('');
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao enviar convite.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">

      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-4xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Gerenciamento de Convites</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Acompanhe e revogue convites enviados à equipe.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="text-[#B5071A] animate-spin" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando convites...</p>
          </div>
        ) : showForm ? (
          /* FORMULÁRIO PARA ENVIAR CONVITE */
          <div className="max-w-md mx-auto w-full border border-gray-100 rounded-2xl p-6 shadow-sm bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Enviar Convite</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEnviarConvite} className="space-y-5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Colaborador</label>
                <select
                  required
                  value={selectedColabId}
                  onChange={e => setSelectedColabId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none bg-white cursor-pointer transition-all"
                >
                  <option value="">Selecione um colaborador...</option>
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" label="Cancelar" onClick={() => setShowForm(false)} />
                <Button 
                  type="submit" 
                  disabled={sending || !selectedColabId}
                  icon={sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  label={sending ? 'Enviando...' : 'Enviar'} 
                />
              </div>
            </form>
          </div>
        ) : convites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Mail size={40} className="text-gray-200" />
            <p className="text-gray-500 font-bold text-sm">Nenhum convite encontrado.</p>
            <p className="text-gray-400 text-xs mb-4">Os convites enviados aparecerão aqui.</p>
            <Button label="Enviar Convite" icon={<Plus size={14} />} onClick={() => setShowForm(true)} />
          </div>
        ) : (
          <DataTable<ConviteRow>
            columns={[
              { header: 'Colaborador' },
              { header: 'Token' },
              { header: 'Expira em' },
              { header: 'Situação' },
              { header: 'Ação', className: 'text-center' },
            ]}
            gridCols="grid-cols-[1.5fr_1.5fr_1fr_1fr_80px]"
            items={convites}
            rowKey={cv => cv.token}
            emptyMessage="Nenhum convite encontrado."
            containerClassName="mb-6"
            onRowClick={cv => setSelected(prev => prev?.token === cv.token ? null : cv)}
            isRowSelected={cv => selected?.token === cv.token}
            renderRow={cv => {
              const revogado = isRevogado(cv.expira_em, cv.usado);
              const expirado = !revogado && isExpirado(cv.expira_em);
              return (
                <>
                  <span className="text-xs font-bold text-gray-700 uppercase truncate">{cv.nomeColaborador}</span>
                  <span className="text-[10px] font-mono text-gray-400 truncate">{cv.token.split('-')[0].toUpperCase()}…</span>
                  <span className="text-xs text-gray-500">{revogado ? '—' : formatDate(cv.expira_em)}</span>
                  <div className="flex items-center gap-1.5">
                    {revogado ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <Ban size={10} /> Revogado
                      </span>
                    ) : cv.usado ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle size={10} /> Usado
                      </span>
                    ) : expirado ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        <Clock size={10} /> Expirado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pendente</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {revoking === cv.token ? (
                      <Loader2 size={14} className="animate-spin text-[#B5071A]" />
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); handleRevogar(cv); }}
                        disabled={cv.usado || revogado}
                        className="text-gray-300 hover:text-[#B5071A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </>
              );
            }}
            renderMobileCard={cv => {
              const revogado = isRevogado(cv.expira_em, cv.usado);
              const expirado = !revogado && isExpirado(cv.expira_em);
              return (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-gray-700 uppercase">{cv.nomeColaborador}</span>
                    {revogado ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <Ban size={10} /> Revogado
                      </span>
                    ) : cv.usado ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle size={10} /> Usado
                      </span>
                    ) : expirado ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        <Clock size={10} /> Expirado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pendente</span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 mb-1">{cv.token.split('-')[0].toUpperCase()}…</p>
                  <p className="text-[11px] text-gray-500">{revogado ? 'Revogado' : `Expira: ${formatDate(cv.expira_em)}`}</p>
                </>
              );
            }}
          />
        )}

        {/* BARRA DE AÇÕES INFERIOR */}
        {!showForm && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:border-none md:p-0 md:mt-4 md:flex md:justify-end md:gap-3">
            <div className="grid grid-cols-2 gap-2 md:flex md:gap-3">
              <Button
                label="Enviar Convite"
                icon={<Plus size={14} />}
                onClick={() => setShowForm(true)}
              />
              <Button
                label="Atualizar"
                variant="secondary"
                icon={<RefreshCw size={14} />}
                onClick={load}
              />
              <Button
                label={resending ? 'Reenviando...' : 'Reenviar'}
                icon={resending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                variant="secondary"
                disabled={!selected || !!resending || !!revoking || selected?.usado}
                className={(!selected || selected?.usado) ? 'opacity-30 cursor-not-allowed' : ''}
                onClick={() => selected && handleReenviar(selected)}
              />
              <Button
                label={revoking ? 'Revogando...' : 'Revogar'}
                icon={revoking ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                disabled={!selected || !!revoking || selected?.usado || (selected ? isRevogado(selected.expira_em, selected.usado) : false)}
                className={!selected || selected?.usado ? 'opacity-30 cursor-not-allowed' : ''}
                onClick={() => selected && handleRevogar(selected)}
              />
              <Button label="Voltar" variant="secondary" onClick={() => navigate('/users')} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}