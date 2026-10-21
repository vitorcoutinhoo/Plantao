import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { authService } from '../../services/authService';
import { collaboratorService } from '../../services/collaboratorService';
import api from '../../services/api';
import { DataTable } from '../../components/DataTable';

interface UserRow {
  id: string;
  id_colaborador: string;
  email: string;
  role: string;
  ativo: string;
  nome: string;
}

interface Role {
  id: string;
  nome: string;
}

export function Permissions() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [usuariosRaw, colaboradores, rolesRaw] = await Promise.all([
          authService.listarUsuarios(),
          collaboratorService.getAll(),
          api.get('/roles'),
        ]);

        const colabMap: Record<string, string> = {};
        colaboradores.forEach(c => { colabMap[c.id] = c.nome; });

        setUsers(usuariosRaw.map((u: any) => ({
          ...u,
          nome: colabMap[u.id_colaborador] ?? '—',
          ativo: u.ativo?.toLowerCase() === 'ativo' || u.ativo === true || u.ativo === 'S' ? 'S' : 'N',
        })));

        setRoles(rolesRaw.data);
      } catch {
        alert('Erro ao carregar usuários.');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSaving(userId);
    try {
      await authService.atualizarRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao atualizar permissão.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">

      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-4xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Permissões de Usuário</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Gerencie os níveis de acesso da equipe.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="text-[#B5071A] animate-spin" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando usuários...</p>
          </div>
        ) : (
          <DataTable<UserRow>
            columns={[
              { header: 'Nome' },
              { header: 'E-mail' },
              { header: 'Status' },
              { header: 'Permissão', className: 'text-center' },
            ]}
            gridCols="grid-cols-[1fr_1.5fr_1fr_130px]"
            items={users}
            rowKey={u => u.id}
            emptyMessage="Nenhum usuário encontrado."
            containerClassName="mb-6"
            mobileClassName="pb-24"
            renderRow={u => (
              <>
                <div className="flex items-center gap-2">
                  {u.role?.toLowerCase() === 'admin'
                    ? <ShieldCheck size={14} className="text-[#B5071A] shrink-0" />
                    : <ShieldAlert size={14} className="text-gray-300 shrink-0" />
                  }
                  <span className="text-xs font-bold text-gray-700 uppercase truncate">{u.nome}</span>
                </div>
                <span className="text-xs text-gray-500 truncate">{u.email}</span>
                <span className={`text-[10px] font-bold w-fit px-2 py-1 rounded-full ${u.ativo === 'S' ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                  {u.ativo === 'S' ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex justify-center">
                  {saving === u.id ? (
                    <Loader2 size={16} className="animate-spin text-[#B5071A]" />
                  ) : (
                    <select
                      value={u.role?.toLowerCase()}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-gray-200 outline-none focus:border-[#B5071A] cursor-pointer bg-white transition-colors"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.nome.toLowerCase()}>
                          {r.nome.charAt(0).toUpperCase() + r.nome.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}
            renderMobileCard={u => (
              <>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {u.role?.toLowerCase() === 'admin'
                      ? <ShieldCheck size={14} className="text-[#B5071A]" />
                      : <ShieldAlert size={14} className="text-gray-300" />
                    }
                    <span className="text-sm font-bold text-gray-700 uppercase">{u.nome}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.ativo === 'S' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {u.ativo === 'S' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">{u.email}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Permissão:</span>
                  {saving === u.id ? (
                    <Loader2 size={14} className="animate-spin text-[#B5071A]" />
                  ) : (
                    <select
                      value={u.role?.toLowerCase()}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-gray-200 outline-none focus:border-[#B5071A] cursor-pointer bg-white"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.nome.toLowerCase()}>
                          {r.nome.charAt(0).toUpperCase() + r.nome.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}
          />
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:border-none md:p-0 md:mt-4 md:flex md:justify-end">
          <button
            onClick={() => navigate('/users')}
            className="w-full md:w-auto bg-[#1E293B] text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase shadow-sm active:scale-95 transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
