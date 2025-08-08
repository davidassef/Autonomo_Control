import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]} ${className}`} />
  );
};

interface LoadingStateProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingState: React.FC<LoadingStateProps> = ({
  fullScreen = false,
  message = 'Carregando...',
  size = 'md'
}) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 flex justify-center items-center bg-gray-100 z-50'
    : 'flex justify-center items-center p-4';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center space-y-2">
        <LoadingSpinner size={size} />
        {message && (
          <span className="text-gray-600 text-sm">{message}</span>
        )}
      </div>
    </div>
  );
};

export { LoadingSpinner, LoadingState };
export default LoadingState;
