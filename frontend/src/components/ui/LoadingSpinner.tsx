import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  fullScreen?: boolean;
  text?: string;
  centralized?: boolean;
  ariaLabel?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'indigo',
  className = '',
  fullScreen = false,
  text,
  centralized = false,
  ariaLabel = 'Carregando'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = color ? `border-${color}-500` : 'border-indigo-500';

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex justify-center items-center bg-white bg-opacity-75 z-50'
    : centralized
    ? 'flex justify-center items-center'
    : '';

  return (
    <div className={`${containerClasses}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${colorClasses} ${className}`}
        role="status"
        aria-label={ariaLabel}
        data-testid="loading-spinner"
      >
        <span className="sr-only">Carregando...</span>
      </div>
      {text && (
        <span className="ml-2 text-gray-600">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;