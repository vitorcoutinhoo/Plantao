import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import logo from '../assets/images/logo.png';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos antes de continuar.");
      return;
    }
    setLoading(true);
    try {
      const usuario = await authService.login({ email: email.trim(), senha: password });
      const colaboradorRaw = localStorage.getItem('@Intellisys:colaborador');
      const colaborador = colaboradorRaw ? JSON.parse(colaboradorRaw) : null;
      if (colaborador && colaborador.status?.toLowerCase() === 'inativo') {
        authService.logout();
        setError("Sua conta está inativa. Entre em contato com o administrador.");
        return;
      }
      navigate(usuario.role?.toLowerCase() === 'financeiro' ? '/financeiro' : '/home');
    } catch (err: any) {
      setError(err.response?.data?.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] font-inter px-4 relative overflow-hidden">

      {/* GRID DE FUNDO COM FADE NAS BORDAS */}
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

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10">

          <div className="flex justify-center mb-8">
            <motion.img layoutId="app-logo" src={logo} alt="Intellisys" className="h-8 w-auto object-contain" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="bg-red-50 border border-red-100 text-[#B5071A] text-xs px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* E-MAIL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                required
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#B5071A] focus:bg-white outline-none transition-all disabled:opacity-50 shadow-sm"
              />
            </div>

            {/* SENHA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  className="w-full h-11 px-4 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#B5071A] focus:bg-white outline-none transition-all disabled:opacity-50 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
              <div className="flex justify-end mt-0.5">
                <button
                  type="button"
                  onClick={() => navigate('/recovery')}
                  className="text-[11px] text-gray-400 hover:text-[#B5071A] transition-colors hover:underline underline-offset-4"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#B5071A] hover:bg-[#9a0615] text-white font-bold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-1 shadow-md"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Autenticando...' : 'Entrar'}
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
