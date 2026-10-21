import perfilImg from '../assets/images/avatar_login.png';

interface UserAvatarProps {
  name?: string;
  photoUrl?: string;
}

export function UserAvatar({ name, photoUrl }: UserAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-white/20 overflow-hidden shrink-0 shadow-sm">
        <img
          src={photoUrl || perfilImg}
          alt="Foto de perfil"
          className="h-full w-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = perfilImg; }}
        />
      </div>

      {name && (
        <span className="hidden md:block text-white font-bold text-sm tracking-wide">
          {name}
        </span>
      )}
    </div>
  );
}