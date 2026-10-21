import { useState, useEffect } from 'react';
import { Activity, Loader2, UserPlus, ShieldCheck, Mail, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { SearchBar } from '../../components/SearchBar';
import { DataTable } from '../../components/DataTable';
import { collaboratorService, type Collaborator } from '../../services/collaboratorService';
import { authService } from '../../services/authService';
import { conviteService } from '../../services/conviteService';
import api from '../../services/api';

export function All() {
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [colabsComUsuario, setColabsComUsuario] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFinanceiro, setIsFinanceiro] = useState(false);

  const { searchTerm, setSearchTerm } = useOutletContext<{
    searchTerm: string;
    setSearchTerm: (v: string) => void;
  }>();

  useEffect(() => {
    async function loadCollaborators() {
      try {
        const usuario = await authService.getUsuario();
        const userIsAdmin = usuario?.role?.toLowerCase() === 'admin';
        const userIsFinanceiro = usuario?.role?.toLowerCase() === 'financeiro';
        setIsAdmin(userIsAdmin);
        setIsFinanceiro(userIsFinanceiro);
        if (!userIsAdmin && !userIsFinanceiro) return;

        if (userIsFinanceiro) {
          setCollaborators(await collaboratorService.getAll());
          return;
        }

        const [data, usuarios] = await Promise.all([collaboratorService.getAll(), api.get('/admin/all')]);

        const idsComUsuario = new Set<string>(
          usuarios.data.map((u: any) => u.id_colaborador).filter(Boolean)
        );

        setCollaborators(data);
        setColabsComUsuario(idsComUsuario);
      } catch {
        // erro silencioso
      } finally {
        setLoading(false);
      }
    }
    loadCollaborators();
  }, []);

  const filtered = collaborators.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (c: Collaborator) => {
    setSelected(prev => prev?.id === c.id ? null : c);
  };

  const handleCriarUsuario = async () => {
    if (!selected) return;
    try {
      setSending(true);
      await conviteService.criar(selected.id, selected.email, selected.nome);
      alert(`Convite enviado para ${selected.email}`);
      setColabsComUsuario(prev => new Set(prev).add(selected.id));
      setSelected(null);
    } catch {
      alert('Erro ao enviar convite. Tente novamente.');
      // mantém o registro selecionado para o usuário poder tentar novamente
    } finally {
      setSending(false);
    }
  };

  const selectedTemUsuario = selected ? colabsComUsuario.has(selected.id) : false;
  const canCreateUser = isAdmin && selected !== null && !selectedTemUsuario;

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Excluir colaborador ${selected.nome}? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      await collaboratorService.delete(selected.id);
      setCollaborators(prev => prev.filter(c => c.id !== selected.id));
      setSelected(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao excluir colaborador.');
    } finally {
      setDeleting(false);
    }
  };

  if (!loading && !isAdmin && !isFinanceiro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <Activity size={40} className="text-[#B5071A]" />
        </div>
        <h2 className="text-[#B5071A] font-bold text-xl uppercase tracking-tighter">Acesso Restrito</h2>
        <p className="text-gray-500 mt-2 max-w-xs text-sm">
          Sua conta não possui privilégios de Administrador para gerenciar a equipe.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 bg-[#1E293B] text-white px-8 py-2 rounded-lg font-bold text-xs shadow-md active:scale-95 transition-all"
        >
          VOLTAR AO INÍCIO
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col pt-6">

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center w-full mb-4 md:mb-2">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Colaboradores</h2>
            <p className="text-[10px] md:text-sm text-gray-500 font-medium">
              {isFinanceiro ? 'Consulte os colaboradores cadastrados no sistema.' : 'Gerencie sua equipe e permissões.'}
            </p>
          </div>
        </div>

        <div className="w-full md:hidden px-2">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="text-[#B5071A] animate-spin" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando colaboradores...</p>
          </div>
        ) : (
          <>
            <DataTable<Collaborator>
              columns={[
                { header: 'Código' },
                { header: 'Nome' },
                { header: 'Cargo' },
                { header: 'Setor' },
                { header: 'Status', className: 'text-center' },
              ]}
              gridCols="grid-cols-[0.5fr_1fr_1fr_0.5fr_100px]"
              items={filtered}
              rowKey={c => c.id}
              emptyMessage="Nenhum colaborador encontrado."
              maxHeight="400px"
              containerClassName="mb-6"
              onRowClick={isFinanceiro ? undefined : handleRowClick}
              onRowDoubleClick={isFinanceiro ? undefined : c => navigate(`/users/details/${c.id}`)}
              isRowSelected={isFinanceiro ? undefined : c => selected?.id === c.id}
              renderRow={c => (
                <>
                  <span className="text-sm font-bold text-gray-400">{c.id.split('-')[0].toUpperCase()}</span>
                  <span className="text-xs font-bold text-gray-700 uppercase">{c.nome}</span>
                  <span className="text-xs font-medium text-gray-600">{c.cargo}</span>
                  <span className="text-xs font-medium text-gray-600">{c.setor}</span>
                  <div className="flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${c.status === 'ativo' ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                      {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </>
              )}
              renderMobileCard={c => (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gray-400">CÓD: {c.id.split('-')[0].toUpperCase()}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${c.status === 'ativo' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-700 uppercase">{c.nome}</p>
                  <p className="text-[11px] text-gray-500">{c.cargo} — {c.setor}</p>
                </>
              )}
            />
            {filtered.length > 2 && (
              <div className="md:hidden text-center py-2">
                <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
              </div>
            )}
          </>
        )}

        {/* BOTÕES DE AÇÃO */}
        {!isFinanceiro && <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:border-none md:p-0 md:mt-6">
          <div className="max-w-7xl mx-auto flex justify-end gap-2 md:gap-3">
            {isAdmin && (
              <Button
                label={sending ? 'Enviando...' : 'Convidar'}
                icon={<UserPlus size={14} />}
                disabled={!canCreateUser || sending}
                onClick={handleCriarUsuario}
                className={!canCreateUser ? 'opacity-30 cursor-not-allowed' : ''}
              />
            )}
           <Button label="Incluir" onClick={() => navigate('/users/create')} />
            {isAdmin && (
              <Button label="Convites" icon={<Mail size={14} />} onClick={() => navigate('/convites')} />
            )}
            {isAdmin && (
              <Button label="Permissões" icon={<ShieldCheck size={14} />} onClick={() => navigate('/users/permissions')} />
            )}
            <Button
              label="Editar"
              disabled={!selected}
              onClick={() => selected && navigate(`/users/edit/${selected.id}`)}
              className={!selected ? 'opacity-30 cursor-not-allowed' : ''}
            />
            {isAdmin && (
              <Button
                label={deleting ? 'Excluindo...' : 'Excluir'}
                icon={deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                variant="secondary"
                disabled={!selected || deleting}
                className={!selected ? 'opacity-30 cursor-not-allowed' : ''}
                onClick={handleDelete}
              />
            )}
            <Button label="Voltar" variant="secondary" onClick={() => navigate('/home')} />
          </div>
        </div>}
      </div>
    </div>
  );
}
