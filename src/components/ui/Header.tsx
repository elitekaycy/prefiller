import { ComponentChildren } from 'preact';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  children?: ComponentChildren;
}

export const Header = ({ title, onBack, children }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};
