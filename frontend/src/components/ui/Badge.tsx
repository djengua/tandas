import type { ReactNode } from 'react';

type BadgeTheme = 'yellow' | 'green' | 'blue' | 'red' | 'gray' | 'indigo';

interface BadgeProps {
  children: ReactNode;
  theme?: BadgeTheme;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const themes: Record<BadgeTheme, string> = {
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  gray: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

const dotColors: Record<BadgeTheme, string> = {
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  gray: 'bg-gray-500',
  indigo: 'bg-indigo-500',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ children, theme = 'gray', size = 'md', dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ring-1 ring-inset ${themes[theme]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[theme]}`} />}
      {children}
    </span>
  );
}
