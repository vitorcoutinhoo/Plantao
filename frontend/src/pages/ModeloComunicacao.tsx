import { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Pencil, X, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import api from '../services/api';

// 1. ADICIONADO 'ativo' NA INTERFACE
interface Modelo {
  id: string;
  nome: string;
  tipo_comunicacao: string;
  assunto: string;
  corpo: string;
  ativo: string; 
}

// 2. ADICIONADO 'ativo' COM VALOR PADRÃO
const emptyForm = {
  nome: '',
  tipo_comunicacao: ' ',
  assunto: '',
  corpo: '',
  ativo: 'true', // Ajuste para 'ativo' ou true se o back exigir diferente
};

export function ModeloComunicacao() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Modelo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  async function loadModelos() {
    setLoading(true);
    try {
      const res = await api.get('/auth/admin/modelo-comunicacao/');
      setModelos(Array.isArray(res.data) ? res.data : []);
    } catch {
      setModelos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadModelos(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  // 3. ATUALIZADO PARA CAPTURAR O STATUS ATUAL NA EDIÇÃO
  const openEdit = (m: Modelo) => {
    setEditingId(m.id);
    setFormData({ 
      nome: m.nome, 
      tipo_comunicacao: m.tipo_comunicacao, 
      assunto: m.assunto, 
      corpo: m.corpo,
      ativo: m.ativo || 'true' // Passando o status atual para o formData
    });
    setShowForm(true);
    setSelected(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        // Aqui o formData já vai incluir o { ativo: "..." } exigido pelo UpdateRequestDTO
        await api.put(`/auth/admin/modelo-comunicacao/${editingId}`, formData);
      } else {
        // Na Criação (POST), o DTO NÃO possui o campo 'ativo'. Vamos removê-lo:
        const dataToPost = { ...formData };
        delete (dataToPost as any).ativo; // Remove o campo para não quebrar o binding do Go

        await api.post('/auth/admin/modelo-comunicacao/', dataToPost);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      await loadModelos();
    } catch {
      alert('Erro ao salvar modelo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">

      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-4xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Modelos de Comunicação</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Gerencie os templates de e-mail do sistema.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="text-[#B5071A] animate-spin" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando modelos...</p>
          </div>
        ) : modelos.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <FileText size={40} className="text-gray-200" />
            <p className="text-gray-500 font-bold text-sm">Nenhum modelo cadastrado.</p>
            <p className="text-gray-400 text-xs">Crie o primeiro modelo de comunicação.</p>
          </div>
        ) : !showForm ? (
          <DataTable<Modelo>
            columns={[
              { header: 'Nome' },
              { header: 'Tipo' },
              { header: 'Assunto' },
            ]}
            gridCols="grid-cols-[1.5fr_1fr_1.5fr]"
            items={modelos}
            rowKey={m => m.id}
            emptyMessage="Nenhum modelo cadastrado."
            containerClassName="mb-6"
            onRowClick={m => setSelected(prev => prev?.id === m.id ? null : m)}
            isRowSelected={m => selected?.id === m.id}
            renderRow={m => (
              <>
                <span className="text-xs font-bold text-gray-700 truncate">{m.nome}</span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full w-fit truncate">{m.tipo_comunicacao}</span>
                <span className="text-xs text-gray-500 truncate">{m.assunto}</span>
              </>
            )}
            renderMobileCard={m => (
              <>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-gray-700">{m.nome}</span>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{m.tipo_comunicacao}</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">{m.assunto}</p>
              </>
            )}
          />
        ) : (
          /* FORMULÁRIO */
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                {editingId ? 'Editar Modelo' : 'Novo Modelo'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Nome do Modelo</label>
                <input
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Ex: Convite de Acesso"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Tipo</label>
                <select
                  name="tipo_comunicacao"
                  value={formData.tipo_comunicacao}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all cursor-pointer"
                >
                  <option value="Plantão Agendado">Plantão Agendado</option>
                  <option value="Plantão Concluido">Plantão Concluído</option>
                  <option value="Plantão Ainda Está Aberto">Plantão Ainda Está Aberto</option>
                  <option value="Plantão Pago">Plantão Pago</option>
                  <option value="Colaborador Cadastrado">Colaborador Cadastrado</option>
                  <option value="Colaborador Atualizado">Colaborador Atualizado</option>
                  <option value="Colaborador Deletado">Colaborador Deletado</option>
                  <option value="Usuário Cadastrado">Usuário Cadastrado</option>
                  <option value="Email do Usuário Atualizado">Email do Usuário Atualizado</option>
                  <option value="Senha do Usuário Atualizada">Senha do Usuário Atualizada</option>
                  <option value="Usuário Deletado">Usuário Deletado</option>
                </select>
              </div>

              {/* OPCIONAL: SE QUISER ADICIONAR UM INPUT/SELECT PARA ATIVAR/DESATIVAR NO FORMULÁRIO DE EDIÇÃO */}
              {editingId && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Status</label>
                  <select
                    name="ativo"
                    value={formData.ativo}
                    onChange={handleChange}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all cursor-pointer"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Assunto</label>
                <input
                  name="assunto"
                  type="text"
                  required
                  value={formData.assunto}
                  onChange={handleChange}
                  placeholder="Ex: Bem-vindo ao sistema Intellisys"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">
                  Corpo do E-mail
                  <span className="ml-2 text-gray-300 normal-case font-normal">{'{{.nome}}'} {'{{.email}}'} {'{{.dataInicio}}'} {'{{.dataFim}}'} {'{{.valorPago}}'} {'{{.Link}}'}</span>
                </label>
                <textarea
                  name="corpo"
                  required
                  value={formData.corpo}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Olá {{.nome}}, seu acesso foi criado..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-[#B5071A] outline-none transition-all resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  label="Cancelar"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={saving}
                  icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  label={saving ? 'Salvando...' : 'Salvar Modelo'}
                />
              </div>
            </form>
          </div>
        )}

        {!showForm && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:border-none md:p-0 md:mt-4 md:flex md:justify-end md:gap-3">
            <div className="grid grid-cols-3 gap-2 md:flex md:gap-3">
              <Button
                label="Editar"
                icon={<Pencil size={14} />}
                variant="secondary"
                disabled={!selected}
                className={!selected ? 'opacity-30 cursor-not-allowed' : ''}
                onClick={() => selected && openEdit(selected)}
              />
              <Button
                label="Novo"
                icon={<Plus size={14} />}
                onClick={openCreate}
              />
              <Button
                label="Voltar"
                variant="secondary"
                onClick={() => window.history.back()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}