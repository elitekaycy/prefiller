import { ComponentChildren } from 'preact';

interface FixedFooterProps {
  children: ComponentChildren;
  className?: string;
}

export const FixedFooter = ({ children, className = '' }: FixedFooterProps) => {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-4 shadow-lg ${className}`}
      style={{
        backgroundColor: 'var(--gemini-bg)',
        borderTop: '1px solid var(--gemini-border)'
      }}
    >
      <div className="flex gap-2 justify-end">
        {children}
      </div>
    </div>
  );
};
