import { useState } from 'react';
import { Loader2, Save, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { getRole } from '../utils/accessControl';

export function Perfil() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const isFinanceiro = getRole() === 'financeiro';

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (senha && senha !== confirmSenha) {
      alert('As senhas não coincidem.');
      return;
    }
    const payload: { email?: string; senha?: string } = {};
    if (email.trim()) payload.email = email.trim();
    if (senha) payload.senha = senha;
    if (!payload.email && !payload.senha) {
      alert('Preencha ao menos um campo para atualizar.');
      return;
    }
    setSaving(true);
    try {
      await authService.updateConta(payload);
      setSuccessMsg('Dados atualizados com sucesso!');
      setEmail('');
      setSenha('');
      setConfirmSenha('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao atualizar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDesativarConta = async () => {
    if (!confirm('Deseja desativar sua conta? Esta ação encerrará sua sessão.')) return;
    setDeactivating(true);
    try {
      await authService.desativarConta();
      authService.logout();
      navigate('/');
    } catch {
      alert('Não foi possível desativar sua conta.');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-lg mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Minha Conta</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Atualize seu e-mail ou senha de acesso.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full">
        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-xs font-bold text-green-600">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Novo E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Deixe em branco para não alterar"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-[#B5071A] outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Nova Senha</label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                className="w-full h-11 px-4 pr-10 rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-[#B5071A] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Confirmar Nova Senha</label>
            <input
              type={showSenha ? 'text' : 'password'}
              value={confirmSenha}
              onChange={e => setConfirmSenha(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-[#B5071A] outline-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" label="Voltar" onClick={() => navigate(-1)} />
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              label={saving ? 'Salvando...' : 'Salvar'}
            />
          </div>
        </form>

        {isFinanceiro && <div className="mt-10 pt-6 border-t border-red-100">
          <h3 className="text-sm font-bold text-red-700">Desativar conta</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">Sua conta será desativada e a sessão encerrada.</p>
          <Button
            type="button"
            variant="secondary"
            disabled={deactivating}
            label={deactivating ? 'Desativando...' : 'Desativar minha conta'}
            icon={deactivating ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            onClick={handleDesativarConta}
            className="text-red-700 border-red-200 hover:bg-red-50"
          />
        </div>}
      </div>
    </div>
  );
}
