import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import logo from '../assets/images/logo.png';

export function Cadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const nome = searchParams.get('nome') ?? '';

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] font-inter px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10 w-full max-w-sm text-center">
          <p className="text-[#B5071A] font-bold text-sm">Link inválido ou expirado.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline">
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await authService.cadastro(token, senha);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar conta. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] font-inter px-4">
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10 w-full max-w-sm text-center flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-green-50 p-4 rounded-full">
            <ShieldCheck size={36} className="text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Conta criada com sucesso!</h2>
          <p className="text-gray-400 text-xs">Você já pode fazer login com suas credenciais.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 w-full h-11 bg-[#B5071A] text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-md"
          >
            Ir para o Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] font-inter px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #999999 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)',
          opacity: 0.25,
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10">
          <div className="flex justify-center mb-6">
            <motion.img layoutId="app-logo" src={logo} alt="Intellisys" className="h-8 w-auto object-contain" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-base font-bold text-gray-800">
              {nome ? `Olá, ${nome.split(' ')[0]}!` : 'Bem-vindo!'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Defina sua senha para acessar o sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-[#B5071A] text-xs px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full h-11 px-4 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#B5071A] focus:bg-white outline-none transition-all disabled:opacity-50 shadow-sm"
                />
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showSenha ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmar Senha</label>
              <div className="relative">
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  required
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full h-11 px-4 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#B5071A] focus:bg-white outline-none transition-all disabled:opacity-50 shadow-sm"
                />
                <button type="button" onClick={() => setShowConfirmar(!showConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showConfirmar ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#B5071A] hover:bg-[#9a0615] text-white font-bold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-md"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Intellisys Informática Ltda &copy; 2026
        </p>
      </div>
    </div>
  );
}
