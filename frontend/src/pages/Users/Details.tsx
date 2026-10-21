import { useState, useEffect } from 'react';
import {
  Mail, ShieldCheck,
  UserCircle, Briefcase, Loader2, AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { collaboratorService, type Collaborator } from '../../services/collaboratorService';
import { Button } from '../../components/Button';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}

export function Details() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [user, setUser] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await collaboratorService.getById(id);
        setUser(data);
      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 size={40} className="text-[#B5071A] animate-spin" />
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Carregando dados do servidor...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <AlertCircle size={48} className="text-gray-300" />
        <h2 className="text-gray-600 font-bold">Colaborador não encontrado</h2>
        <p className="text-gray-400 text-sm">Não foi possível carregar as informações deste registro.</p>
        <button onClick={() => navigate('/users')} className="bg-[#B5071A] hover:bg-[#9a0615] text-white px-8 py-2 rounded-xl text-sm font-bold transition-all">Voltar para Lista</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-white min-h-full font-inter pt-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-5xl mx-auto w-full md:pt-6">
        <div className="flex items-center justify-center w-full mb-4 md:mb-2">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Detalhes do Colaborador</h2>
            <p className="text-[12px] md:text-sm text-gray-500 font-medium">Veja aqui as informações detalhadas.</p>
          </div>
        </div> 
      </div>      

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: IDENTIFICAÇÃO CORPORATIVA */}
        <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white flex flex-col justify-between">
          <div className="mb-4 flex justify-between items-start">
            <h3 className="text-[#B5071A] font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
              <ShieldCheck size={18} /> Identificação 
            </h3>
            <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase
              ${user.status === 'ativo' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {user.status}
            </span>
          </div>
          
          <div className="flex flex-row-reverse gap-6 items-center justify-between">
            {/* FOTO (DIREITA) */}
            <div className="flex-shrink-0 w-24 h-28 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner">
              {user.foto_url ? (
                <img src={user.foto_url} alt={user.nome} className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={70} strokeWidth={1} className="text-gray-200" />
              )}
            </div>

            {/* DADOS (ESQUERDA) */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Nome Completo</p>
                <p className="text-base font-black text-gray-700 leading-tight uppercase">{user.nome}</p>
              </div>
              
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Código</p>
                  <p className="text-xs font-bold text-gray-600">{user.id.split('-')[0].toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Status Plantão</p>
                  <p className={`text-xs font-bold ${user.ativo_plantao === 'ativo' ? 'text-green-500' : 'text-gray-400'}`}>
                    {user.ativo_plantao === 'ativo' ? 'Disponível' : 'Indisponível'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: CONTATO E COMUNICAÇÃO */}
        <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
          <h3 className="text-[#B5071A] font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Mail size={18} /> Contato
          </h3>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">E-mail Corporativo</p>
                <p className="text-[13px] font-bold text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Telefone / Celular</p>
                <p className="text-[13px] font-bold text-gray-600">{user.telefone ? formatPhone(user.telefone) : <span className="text-gray-300 font-normal italic">Não informado</span>}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: INFORMAÇÕES PROFISSIONAIS */}
        <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white md:col-span-2">
          <h3 className="text-[#B5071A] font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Briefcase size={18} /> Especificações de Cargo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="border-l-2 border-gray-100 pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Setor / Departamento</p>
              <p className="text-sm font-bold text-gray-700">{user.setor}</p>
            </div>
            <div className="border-l-2 border-gray-100 pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Cargo Atual</p>
              <p className="text-sm font-bold text-gray-700">{user.cargo}</p>
            </div>
            <div className="border-l-2 border-gray-100 pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                Data de Admissão
              </p>
              <p className="text-sm font-bold text-gray-700">{user.data_admissao}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex flex-col md:flex-row justify-end gap-3 mt-8 md:mt-12 max-w-5xl mx-auto">
        <Button label="Editar Registro" fullWidthMobile onClick={() => navigate(`/users/edit/${user.id}`)} />
        <Button label="Histórico de Plantões" fullWidthMobile onClick={() => navigate(`/users/duty-history/${user.id}`)} />
        <Button label="Voltar para Lista" variant="secondary" fullWidthMobile onClick={() => navigate('/users')} />
      </div>
    </div>
  );
}