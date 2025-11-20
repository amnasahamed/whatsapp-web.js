/**
 * =============================================================================
 * SETTINGS LAYOUT - Settings Page Layout
 * =============================================================================
 * Layout wrapper for settings pages with navigation tabs
 * =============================================================================
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/helpers';

const settingsNav = [
  { name: 'WhatsApp', href: '/settings/whatsapp' },
  { name: 'AI Configuration', href: '/settings/ai' },
  { name: 'Team', href: '/settings/team' },
  { name: 'Automations', href: '/settings/automations' },
  { name: 'General', href: '/settings/general' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Settings Navigation */}
        <nav className="w-64 space-y-1">
          {settingsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
