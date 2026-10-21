import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import { authService } from '../services/authService';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('USUÁRIO');
  const [userPhoto, setUserPhoto] = useState<string | undefined>();
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // 1. Efeito para carregar o nome e foto do colaborador logado
  useEffect(() => {
    async function loadUserData() {
      try {
        const usuario = await authService.getUsuario();
        setUserRole(usuario.role?.toLowerCase() ?? 'colaborador');
        if (usuario.id_colaborador && usuario.role?.toLowerCase() !== 'financeiro') {
          const colaborador = await authService.getColaborador(usuario.id_colaborador);
          setUserName(colaborador.nome || 'USUÁRIO');
          setUserPhoto(colaborador.foto_url || undefined);
        }
      } catch {
        const savedColab = localStorage.getItem('@Intellisys:colaborador');
        if (savedColab) {
          const colab = JSON.parse(savedColab);
          setUserName(colab.nome || 'USUÁRIO');
          setUserPhoto(colab.foto_url || undefined);
        }
      }
    }

    loadUserData();
  }, []);

  // 2. Lógica de Logout centralizada
  const handleLogout = () => {
    authService.logout(); // Limpa tokens e localStorage
    navigate('/');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden font-inter">
      <AppHeader
        userName={userName}
        userPhoto={userPhoto}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {userRole === null ? (
          <div className={`hidden md:block shrink-0 bg-white shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] ${isSidebarOpen ? 'w-52' : 'w-14'}`} />
        ) : (
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
            role={userRole}
          />
        )}

        <motion.main
          className="flex-1 overflow-y-auto bg-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
           <Outlet context={{ searchTerm, setSearchTerm }} />
        </motion.main>
      </div>
    </div>
  );
}
