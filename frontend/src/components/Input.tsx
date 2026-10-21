import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isPassword?: boolean;
}

export function Input({ label, isPassword, disabled, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <label className="text-sm font-semibold text-intellisys-text font-inter">
        {label}
      </label>
      <div className="relative">
        <input 
          {...props}
          disabled={disabled}
          type={isPassword && !showPassword ? 'password' : 'text'}
          className={`w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-300 outline-none transition-all font-inter
            ${disabled ? 'cursor-not-allowed opacity-50' : 'focus:border-[#B5071A] focus:bg-white'}`}
        />
        
        {isPassword && (
          <button 
            type="button"
            // Permitimos o clique no olho mesmo se o input estiver disabled para teste visual
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff size={20} strokeWidth={1.5} /> 
            ) : (
              <Eye size={20} strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}