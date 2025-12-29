import { ComponentChildren } from 'preact';

interface FixedFooterProps {
  children: ComponentChildren;
  className?: string;
}

export const FixedFooter = ({ children, className = '' }: FixedFooterProps) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg ${className}`}>
      <div className="flex gap-2 justify-end">
        {children}
      </div>
    </div>
  );
};
