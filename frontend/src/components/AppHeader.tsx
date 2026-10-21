import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/images/logo.png';
import { UserAvatar } from './UserAvatar';

interface AppHeaderProps {
  userName?: string;
  userPhoto?: string;
  onLogout?: () => void;
}

export function AppHeader({
  userName,
  userPhoto,
  onLogout,
}: AppHeaderProps) {
  return (
    <motion.header
      className="relative h-18 md:h-20 flex items-center justify-between px-4 md:px-10 bg-white shadow-md z-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.2 }}
    >

      {/* Logo */}
      <div className="z-40 flex items-center shrink-0">
        <motion.img layoutId="app-logo" src={logo} alt="Intellisys" className="h-6 md:h-8 w-auto object-contain" />
      </div>

      {/* Diagonal */}
      <div className="absolute right-0 top-0 h-full w-[40%] md:w-[78%] bg-[#B5071A] diagonal-bg flex items-center justify-end px-4 md:px-16 gap-3 md:gap-12 z-20">

        {(userName !== undefined || onLogout) && (
          <div className="flex items-center gap-3 md:gap-8 text-white">
            {userName !== undefined && (
              <UserAvatar name={userName} photoUrl={userPhoto} />
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hover:opacity-80 active:scale-90 transition-all outline-none"
                title="Sair do sistema"
              >
                <LogOut size={window.innerWidth < 768 ? 22 : 26} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}
