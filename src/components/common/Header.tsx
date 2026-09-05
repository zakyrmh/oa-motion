import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  stepText?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  variant?: 'light' | 'dark';
  className?: string;
}

export function Header({
  title,
  stepText,
  onBack,
  rightAction,
  variant = 'light',
  className,
}: HeaderProps) {
  const isDark = variant === 'dark';

  return (
    <header
      className={cn(
        'sticky top-0 z-20 p-4 flex flex-col gap-3 backdrop-blur-md',
        isDark ? 'bg-black/80 text-white' : 'bg-[#e5e5e5]/90 text-black',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className={cn(
                'size-12 rounded-full border-none shadow-none shrink-0 transition-transform active:scale-95',
                isDark
                  ? 'bg-black/40 hover:bg-black/60 text-[#ffffff] border border-white/10'
                  : 'bg-[#f3f3f3] hover:bg-[#c6c6c6] text-[#000000]'
              )}
              aria-label="Kembali"
            >
              <ArrowLeft className={cn('size-6', isDark ? 'text-white' : 'text-black')} />
            </Button>
          )}

          {stepText && (
            <Badge
              className={cn(
                'font-mono text-xs tracking-tight rounded-full px-3 py-1 font-semibold uppercase border-none shadow-none',
                isDark ? 'bg-[#d1ffca] text-[#000000]' : 'bg-[#d1ffca] text-[#000000]'
              )}
            >
              {stepText}
            </Badge>
          )}
        </div>

        {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
      </div>

      <h1 className={cn('text-2xl sm:text-3xl font-extrabold uppercase tracking-tight px-1', isDark ? 'text-white' : 'text-black')}>
        {title}
      </h1>
    </header>
  );
}
