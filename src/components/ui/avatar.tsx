/**
 * =============================================================================
 * AVATAR - Avatar UI Component
 * =============================================================================
 * User avatar component with fallback support
 * =============================================================================
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/helpers';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const initials = fallback || alt?.substring(0, 2).toUpperCase() || '??';

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-medium text-primary">
          {initials}
        </div>
      )}
    </div>
  );
}
