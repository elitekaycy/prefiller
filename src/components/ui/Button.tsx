import { ComponentChildren } from 'preact';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  className?: string;
}

export const Button = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
}: ButtonProps) => {
  const baseClasses = 'font-medium rounded-lg transition-colors flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      } ${className}`}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
