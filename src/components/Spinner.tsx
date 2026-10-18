interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'blue' | 'red' | 'slate';
}

export default function Spinner({ size = 'md', color = 'blue' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
    red: 'border-red-500 border-t-transparent',
    slate: 'border-slate-400 border-t-transparent',
  };

  return (
    <div 
      className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
    >
      <span className="sr-only">Загрузка...</span>
    </div>
  );
}