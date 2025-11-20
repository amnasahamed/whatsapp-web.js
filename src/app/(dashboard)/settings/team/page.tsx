/**
 * =============================================================================
 * TEAM SETTINGS - Team Management Page
 * =============================================================================
 * Manage team members, roles, and permissions
 * =============================================================================
 */

'use client';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserPlus, MoreVertical } from 'lucide-react';

// Mock data
const teamMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'OWNER',
    status: 'ACTIVE',
    lastActive: new Date(),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastActive: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'AGENT',
    status: 'ACTIVE',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'AGENT',
    status: 'ACTIVE',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const roleColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  OWNER: 'destructive',
  ADMIN: 'default',
  MANAGER: 'default',
  AGENT: 'secondary',
  VIEWER: 'secondary',
};

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar fallback={member.name} className="h-10 w-10" />
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={roleColors[member.role]}>{member.role}</Badge>
                  <Badge variant="outline">{member.status}</Badge>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Configure what each role can do in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium">Owner</h4>
                <Badge variant="destructive">OWNER</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access to all features including billing and account deletion
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium">Admin</h4>
                <Badge>ADMIN</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Can manage team members, settings, and all conversations
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium">Agent</h4>
                <Badge variant="secondary">AGENT</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Can send messages, manage contacts, and view assigned conversations
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium">Viewer</h4>
                <Badge variant="secondary">VIEWER</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only access to conversations and analytics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
