/**
 * =============================================================================
 * DASHBOARD LAYOUT - Protected Dashboard Layout
 * =============================================================================
 * Layout for all authenticated dashboard pages
 * =============================================================================
 */

'use client';

import { MainLayout } from '@/components/layout/MainLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
