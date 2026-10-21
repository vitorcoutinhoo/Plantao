import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Clock, Calendar, FileText, ChevronRight, LogOut, Mail, MessageSquare, DollarSign, Briefcase, UserCog, Server } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  onLogout?: () => void;
  role?: string;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  adminOnly: boolean;
}

interface Section {
  title: string;
  adminOnly: boolean;
  items: MenuItem[];
}

const sections: Section[] = [
  {
    title: 'Gestão',
    adminOnly: false,
    items: [
      { label: 'Colaboradores', path: '/users',      icon: Users,    adminOnly: false },
      { label: 'Plantões',      path: '/duty',        icon: Clock,    adminOnly: false },
      { label: 'Escala',        path: '/scale/month', icon: Calendar, adminOnly: false },
    ],
  },
  {
    title: 'Relatórios',
    adminOnly: false,
    items: [
      { label: 'Relatórios', path: '/reports', icon: FileText, adminOnly: false },
    ],
  },
  {
    title: 'Administração',
    adminOnly: true,
    items: [
      { label: 'Convites',       path: '/convites',            icon: Mail,          adminOnly: true },
      { label: 'Modelos E-mail', path: '/modelo-comunicacao', icon: MessageSquare, adminOnly: true },
      { label: 'Config. SMTP',   path: '/config/email',        icon: Server,        adminOnly: true }, // <-- Novo item
      { label: 'Financeiro',     path: '/financeiro',         icon: DollarSign,    adminOnly: true },
      { label: 'Cargos/Setores', path: '/cargos-setores',     icon: Briefcase,     adminOnly: true },
    ],
  },
  {
    title: 'Conta',
    adminOnly: false,
    items: [
      { label: 'Meu Perfil', path: '/perfil', icon: UserCog, adminOnly: false },
    ],
  },
];

function NavItem({
  label, icon: Icon, isActive, isOpen: sidebarOpen,
  onClick,
}: {
  label: string; path: string; icon: React.ElementType;
  isActive: boolean; isOpen: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={!sidebarOpen ? label : undefined}
      className={[
        'w-full flex items-center gap-3 px-3 py-3 rounded-lg mx-1 text-[11px] font-bold tracking-widest',
        'transition-all whitespace-nowrap overflow-hidden',
        isActive
          ? 'bg-[#B5071A] text-white'
          : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700',
      ].join(' ')}
      style={{ width: sidebarOpen ? 'calc(100% - 8px)' : 'calc(100% - 8px)' }}
    >
      <Icon size={16} className="shrink-0" />
      {sidebarOpen && <span className="uppercase truncate">{label}</span>}
    </button>
  );
}

export function Sidebar({ isOpen, onToggle, onClose, onLogout, role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'gerente';
  const isFinanceiro = role === 'financeiro';

  const visibleSections = isFinanceiro
    ? [
        { ...sections[0], items: sections[0].items.filter(item => item.path === '/users') },
        sections[1],
        { ...sections[2], title: 'Financeiro', adminOnly: false, items: sections[2].items.filter(item => item.path === '/financeiro') },
        sections[3],
      ]
    : sections
        .filter(s => !s.adminOnly || isAdmin)
        .map(s => ({ ...s, items: s.items.filter(i => !i.adminOnly || isAdmin) }))
        .filter(s => s.items.length > 0);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768 && onClose) onClose();
  };

  const renderSections = () => (
    <nav className="flex flex-col w-full flex-1 px-1 py-2">
      {visibleSections.map((section, si) => (
        <div key={section.title}>
          {si > 0 && <div className="mx-3 border-t border-gray-200 my-5" />}
          {isOpen && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 px-3 mb-1">
              {section.title}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map(item => (
              <NavItem
                key={item.path}
                label={item.label}
                path={item.path}
                icon={item.icon}
                isActive={location.pathname.startsWith(item.path)}
                isOpen={isOpen}
                onClick={() => handleNavigate(item.path)}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const logoutButton = (
    <div className="px-1 pb-2">
      <div className="mx-2 border-t border-gray-100 mb-2" />
      {onLogout && (
        <button
          onClick={onLogout}
          title={!isOpen ? 'Sair' : undefined}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[11px] font-bold tracking-widest text-gray-400 hover:bg-red-50 hover:text-[#B5071A] transition-all whitespace-nowrap overflow-hidden"
        >
          <LogOut size={16} className="shrink-0" />
          {isOpen && <span className="uppercase">Sair</span>}
        </button>
      )}
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* DESKTOP */}
      <div className="relative hidden md:flex flex-col shrink-0 self-stretch">
        <aside
          className={[
            'bg-white flex flex-col flex-1 transition-all duration-300 ease-in-out',
            'shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)]',
            isOpen ? 'w-52' : 'w-14',
          ].join(' ')}
        >
          {renderSections()}
          {logoutButton}
        </aside>

        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 z-40 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-400 hover:text-[#B5071A] hover:border-[#B5071A] transition-colors"
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* MOBILE */}
      <aside
        className={[
          'md:hidden bg-white flex flex-col transition-all duration-300 ease-in-out z-30',
          'shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)]',
          'fixed inset-y-0 left-0 w-52',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {renderSections()}
        {logoutButton}
      </aside>
    </>
  );
}
