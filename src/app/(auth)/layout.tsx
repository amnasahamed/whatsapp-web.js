/**
 * =============================================================================
 * AUTH LAYOUT - Authentication Pages Layout
 * =============================================================================
 * Simple layout for login and registration pages
 * =============================================================================
 */

import { MessageSquare } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <MessageSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">WhatsApp Command Center</h1>
          <p className="text-muted-foreground">AI-Powered Business Hub</p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
