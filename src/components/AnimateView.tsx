import React from 'react';
import { cn } from '../lib/utils';

interface AnimateViewProps {
  isLoading: boolean;
  fallback: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AnimateView({ isLoading, fallback, children, className }: AnimateViewProps) {
  if (isLoading) {
    return (
      <div className={cn("animate-in fade-in duration-300", className)}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn("animate-in fade-in duration-500", className)}>
      {children}
    </div>
  );
}
