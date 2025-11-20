/**
 * =============================================================================
 * ACTIVITY FEED - Team Activity Timeline
 * =============================================================================
 * Real-time activity feed showing team actions and events
 * =============================================================================
 */

'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils/helpers';
import {
  MessageSquare,
  UserPlus,
  Tag,
  CheckCircle,
  AlertCircle,
  Zap,
  Send,
  Users,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'message' | 'assignment' | 'tag' | 'resolved' | 'automation' | 'campaign' | 'note';
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target?: string;
  timestamp: Date;
}

// Mock data
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'message',
    user: { name: 'John Doe' },
    action: 'replied to',
    target: 'Sarah Williams',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: '2',
    type: 'assignment',
    user: { name: 'Jane Smith' },
    action: 'assigned conversation to',
    target: 'Mike Johnson',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '3',
    type: 'tag',
    user: { name: 'Mike Johnson' },
    action: 'tagged',
    target: 'John Doe as VIP',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: '4',
    type: 'resolved',
    user: { name: 'Sarah Williams' },
    action: 'resolved conversation with',
    target: 'Alex Brown',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '5',
    type: 'automation',
    user: { name: 'System' },
    action: 'Welcome automation sent to',
    target: '5 new contacts',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '6',
    type: 'campaign',
    user: { name: 'John Doe' },
    action: 'started campaign',
    target: 'Summer Sale 2024',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: '7',
    type: 'note',
    user: { name: 'Jane Smith' },
    action: 'added note to conversation with',
    target: 'Sarah Williams',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
];

const activityIcons: Record<Activity['type'], any> = {
  message: MessageSquare,
  assignment: UserPlus,
  tag: Tag,
  resolved: CheckCircle,
  automation: Zap,
  campaign: Send,
  note: AlertCircle,
};

const activityColors: Record<Activity['type'], string> = {
  message: 'text-blue-600',
  assignment: 'text-purple-600',
  tag: 'text-green-600',
  resolved: 'text-green-600',
  automation: 'text-yellow-600',
  campaign: 'text-orange-600',
  note: 'text-gray-600',
};

export function ActivityFeed({ activities = mockActivities }: { activities?: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div key={activity.id} className="flex gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    {activity.target && <span className="font-medium">{activity.target}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
