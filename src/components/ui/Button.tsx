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
  const baseClasses = 'font-medium rounded-lg transition-all flex items-center justify-center gap-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    if (variant === 'primary') {
      return {
        background: 'linear-gradient(135deg, var(--gemini-primary) 0%, hsl(330, 75%, 60%) 100%)',
        color: 'white',
      };
    }
    if (variant === 'secondary') {
      return {
        background: 'var(--gemini-surface)',
        color: 'var(--gemini-text-primary)',
        border: '1px solid var(--gemini-border)',
      };
    }
    if (variant === 'danger') {
      return {
        background: 'var(--gemini-error)',
        color: 'white',
      };
    }
    return {};
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${sizeClasses[size]} ${
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      } ${className}`}
      style={getButtonStyle()}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
