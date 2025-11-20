/**
 * =============================================================================
 * HEADER - Top Header Component
 * =============================================================================
 * Top navigation bar with breadcrumbs, notifications, and user menu
 * =============================================================================
 */

'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/helpers';

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6',
        className
      )}
    >
      {/* Title */}
      {title && <h1 className="text-xl font-semibold">{title}</h1>}

      {/* Search */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
          </span>
        </Button>
      </div>
    </header>
  );
}
