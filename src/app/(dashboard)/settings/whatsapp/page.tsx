/**
 * =============================================================================
 * WHATSAPP SETTINGS - WhatsApp Account Management
 * =============================================================================
 * Manage WhatsApp accounts, connect new accounts, view QR codes
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare, Plus, QrCode, Trash2 } from 'lucide-react';

// Mock data
const mockAccounts = [
  {
    id: '1',
    name: 'Primary Account',
    phone: '+1 234 567 8900',
    status: 'CONNECTED',
    connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Support Account',
    phone: '+1 234 567 8901',
    status: 'CONNECTED',
    connectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default function WhatsAppSettingsPage() {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>WhatsApp Accounts</CardTitle>
              <CardDescription>
                Manage your connected WhatsApp accounts
              </CardDescription>
            </div>
            <Button onClick={() => setShowQR(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={account.status === 'CONNECTED' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <QrCode className="mr-2 h-4 w-4" />
                      View QR
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showQR && (
        <Card>
          <CardHeader>
            <CardTitle>Connect New Account</CardTitle>
            <CardDescription>
              Scan this QR code with WhatsApp on your phone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                <QrCode className="h-32 w-32 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Waiting for connection...</p>
                <p className="text-sm text-muted-foreground">
                  Open WhatsApp on your phone and scan this code
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowQR(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Configure account behavior and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-reconnect</p>
              <p className="text-sm text-muted-foreground">
                Automatically reconnect when disconnected
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Message sync</p>
              <p className="text-sm text-muted-foreground">
                Sync all messages from WhatsApp
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
