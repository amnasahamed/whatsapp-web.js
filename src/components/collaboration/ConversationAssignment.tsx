/**
 * =============================================================================
 * CONVERSATION ASSIGNMENT - Assign Conversations to Team Members
 * =============================================================================
 * Component for assigning conversations to team members
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserPlus, Check } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  activeConversations: number;
  isAvailable: boolean;
}

// Mock team members
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'ADMIN',
    activeConversations: 12,
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'AGENT',
    activeConversations: 8,
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'AGENT',
    activeConversations: 15,
    isAvailable: false,
  },
];

interface ConversationAssignmentProps {
  conversationId: string;
  currentAssignee?: string;
  onAssign?: (userId: string) => void;
}

export function ConversationAssignment({
  conversationId,
  currentAssignee,
  onAssign,
}: ConversationAssignmentProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(currentAssignee || null);
  const [isOpen, setIsOpen] = useState(false);

  const handleAssign = (userId: string) => {
    setSelectedUser(userId);
    onAssign?.(userId);
    setIsOpen(false);
  };

  const assignedUser = mockTeamMembers.find((m) => m.id === selectedUser);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full justify-start"
      >
        {assignedUser ? (
          <div className="flex items-center gap-2">
            <Avatar fallback={assignedUser.name} className="h-6 w-6" />
            <span>Assigned to {assignedUser.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Assign to team member</span>
          </div>
        )}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assign Conversation</CardTitle>
        <CardDescription>Choose a team member to handle this conversation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {mockTeamMembers.map((member) => (
          <button
            key={member.id}
            onClick={() => handleAssign(member.id)}
            className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <Avatar fallback={member.name} className="h-8 w-8" />
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.activeConversations} active conversations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.isAvailable ? (
                <Badge variant="secondary" className="text-xs">
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Away
                </Badge>
              )}
              {selectedUser === member.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          </button>
        ))}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
