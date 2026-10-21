interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidthMobile?: boolean;
}

const variants = {
  primary:   'bg-[#B5071A] hover:bg-[#9a0615] text-white shadow-md',
  secondary: 'bg-[#1E293B] hover:bg-[#2d3f55] text-white shadow-md',
};

const sizes = {
  md: 'px-8 py-2.5 text-xs rounded-xl',
  lg: 'px-12 h-12  text-xs rounded-xl',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidthMobile = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'flex items-center justify-center gap-2 font-bold font-inter uppercase tracking-widest',
        'active:scale-95 transition-all disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidthMobile ? 'w-full md:w-auto' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}
