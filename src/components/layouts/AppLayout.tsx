import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}

export function AppLayout({ children, className, variant = 'light' }: AppLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen flex flex-col justify-between w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto font-sans transition-colors duration-200',
        variant === 'light' ? 'bg-[#e5e5e5] text-[#000000]' : 'bg-[#000000] text-[#ffffff]',
        className
      )}
    >
      {children}
    </div>
  );
}
