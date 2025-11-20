/**
 * =============================================================================
 * SIDEBAR - Navigation Sidebar Component
 * =============================================================================
 * Main navigation sidebar with menu items and account status
 * =============================================================================
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/helpers';
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  Settings,
  Zap,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Inbox',
    href: '/inbox',
    icon: MessageSquare,
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
  {
    name: 'Automations',
    href: '/automations',
    icon: Zap,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">WhatsApp Hub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">U</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">User Name</p>
            <p className="truncate text-xs text-muted-foreground">user@example.com</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
