import { ComponentChildren, createElement } from 'preact';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  children?: ComponentChildren;
  level?: 'h2' | 'h3'; // NEW: Allow specifying heading level for proper document hierarchy
}

export const Header = ({ title, onBack, children, level = 'h2' }: HeaderProps) => {
  // Dynamic heading tag based on level prop
  const HeadingTag = level;

  return (
    <div
      className="flex items-center justify-between mb-4 pb-3"
      style={{ borderBottom: '1px solid var(--gemini-border)' }}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="transition-colors px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: 'var(--gemini-surface)',
              color: 'var(--gemini-text-primary)',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--gemini-surface-hover)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--gemini-surface)';
            }}
            aria-label="Go back to previous step"
            type="button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
        {createElement(HeadingTag, {
          className: "text-xl font-semibold",
          style: { color: 'var(--gemini-text-primary)' }
        }, title)}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};
