import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Calendar, ShieldCheck,
  Briefcase, Save, X, Loader2, Lock, UserCircle, Camera
} from 'lucide-react';
import { collaboratorService } from '../../services/collaboratorService';
import { authService } from '../../services/authService';
import { scaleService } from '../../services/scaleService';
import type { Cargo, Setor } from '../../services/scaleService';
import { Button } from '../../components/Button';

export function Create() {
  const navigate = useNavigate();
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    setor: '',
    status: 'ativo' as 'ativo' | 'inativo',
    ativo_plantao: 'inativo' as 'ativo' | 'inativo',
    data_admissao: '',
  });

  useEffect(() => {
    async function init() {
      try {
        const savedUser = localStorage.getItem('@Intellisys:user');
        const usuario = savedUser ? JSON.parse(savedUser) : await authService.getUsuario();
        setIsAdmin(usuario?.role?.toLowerCase() === 'admin');
        const [cs, ss] = await Promise.all([scaleService.getCargos(), scaleService.getSetores()]);
        setCargos(cs);
        setSetores(ss);
      } catch {
        alert('Erro ao carregar dados do formulário. Tente novamente.');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSaving(true);
      const created = await collaboratorService.create(formData);
      if (fotoFile) {
        await collaboratorService.uploadFoto(created.id, fotoFile);
      }
      navigate(`/users/details/${created.id}`);
    } catch {
      alert("Falha ao criar colaborador. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 size={40} className="text-[#B5071A] animate-spin" />
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Validando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <div className="bg-red-50 p-6 rounded-full">
          <Lock size={48} className="text-[#B5071A]" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Acesso Restrito</h2>
        <p className="text-gray-500 max-w-xs">Você não tem permissão para criar colaboradores.</p>
        <button onClick={() => navigate('/home')} className="mt-4 bg-[#1E293B] text-white px-8 py-2 rounded-xl font-bold text-sm shadow-md">
          VOLTAR PARA HOME
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">

      {/* HEADER */}
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-center w-full mb-4 md:mb-2">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Novo Colaborador</h2>
            <p className="text-[10px] md:text-sm text-gray-500 font-medium">Preencha os dados para cadastrar.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-5xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CARD 1: IDENTIFICAÇÃO */}
          <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white flex flex-col">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-[#B5071A] font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                <ShieldCheck size={18} /> Identificação
              </h3>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                className="text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200 outline-none focus:border-[#B5071A] cursor-pointer"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-6 items-start">
              {/* FOTO */}
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => fotoInputRef.current?.click()}
              >
                <div className="w-24 h-28 bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {fotoPreview ? (
                    <img src={fotoPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <UserCircle size={40} className="text-gray-200" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoChange}
                />
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Status Plantão</label>
                  <select
                    value={formData.ativo_plantao}
                    onChange={(e) => setFormData({ ...formData, ativo_plantao: e.target.value as 'ativo' | 'inativo' })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all cursor-pointer"
                  >
                    <option value="ativo">Disponível</option>
                    <option value="inativo">Indisponível</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: CONTATO */}
          <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
            <h3 className="text-[#B5071A] font-bold mb-6 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Mail size={18} /> Contato Corporativo
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-3.5 text-gray-300" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-11 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Telefone / Ramal</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-3.5 text-gray-300" />
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full h-11 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: PROFISSIONAL */}
          <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white md:col-span-2">
            <h3 className="text-[#B5071A] font-bold mb-6 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Briefcase size={18} /> Informações Profissionais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Setor</label>
                <select
                  required
                  value={formData.setor}
                  onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Cargo</label>
                <select
                  required
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {cargos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 flex items-center gap-1">
                  <Calendar size={12} /> Data de Admissão
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_admissao}
                  onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex flex-col md:flex-row justify-end gap-3 pt-6 pb-12">
          <Button
            type="submit"
            size="lg"
            disabled={saving}
            icon={saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            label={saving ? "Salvando..." : "Cadastrar Colaborador"}
          />
          <Button
            type="button"
            size="lg"
            variant="secondary"
            disabled={saving}
            icon={<X size={18} />}
            label="Cancelar"
            onClick={() => navigate(-1)}
          />
        </div>
      </form>
    </div>
  );
}
