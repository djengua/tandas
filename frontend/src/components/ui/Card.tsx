import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, padding = 'md', hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 ${paddings[padding]} ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all duration-200' : 'shadow-sm'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
