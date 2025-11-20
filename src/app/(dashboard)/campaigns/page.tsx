/**
 * =============================================================================
 * CAMPAIGNS PAGE - Campaign Management
 * =============================================================================
 * List and manage broadcast campaigns with performance metrics
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { Search, Plus, Play, Pause, BarChart3, Users } from 'lucide-react';
import { CampaignStatus } from '@/types/campaign';
import { formatRelativeTime } from '@/lib/utils/helpers';

// Mock data
const mockCampaigns = [
  {
    id: '1',
    name: 'Summer Sale 2024',
    status: CampaignStatus.COMPLETED,
    totalRecipients: 1247,
    sentCount: 1247,
    deliveredCount: 1198,
    readCount: 892,
    repliedCount: 156,
    deliveryRate: 96.1,
    replyRate: 12.5,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Product Launch Announcement',
    status: CampaignStatus.IN_PROGRESS,
    totalRecipients: 3450,
    sentCount: 1825,
    deliveredCount: 1756,
    readCount: 892,
    repliedCount: 78,
    deliveryRate: 96.2,
    replyRate: 4.4,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Weekly Newsletter #42',
    status: CampaignStatus.SCHEDULED,
    totalRecipients: 2100,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    repliedCount: 0,
    deliveryRate: 0,
    replyRate: 0,
    createdAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Customer Feedback Survey',
    status: CampaignStatus.DRAFT,
    totalRecipients: 0,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    repliedCount: 0,
    deliveryRate: 0,
    replyRate: 0,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const statusColors: Record<CampaignStatus, 'default' | 'secondary' | 'destructive'> = {
  [CampaignStatus.DRAFT]: 'secondary',
  [CampaignStatus.SCHEDULED]: 'default',
  [CampaignStatus.IN_PROGRESS]: 'default',
  [CampaignStatus.COMPLETED]: 'secondary',
  [CampaignStatus.PAUSED]: 'secondary',
  [CampaignStatus.CANCELLED]: 'destructive',
};

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = mockCampaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSent = mockCampaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalDelivered = mockCampaigns.reduce((sum, c) => sum + c.deliveredCount, 0);
  const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const totalReplies = mockCampaigns.reduce((sum, c) => sum + c.repliedCount, 0);
  const avgReplyRate = totalDelivered > 0 ? (totalReplies / totalDelivered) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage broadcast campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCampaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDeliveryRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgReplyRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Campaigns</CardTitle>
              <CardDescription>View and manage your campaigns</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge variant={statusColors[campaign.status]}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created {formatRelativeTime(campaign.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{campaign.totalRecipients.toLocaleString()} recipients</span>
                      {campaign.sentCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{campaign.sentCount.toLocaleString()} sent</span>
                          <span>•</span>
                          <span>{campaign.deliveryRate.toFixed(1)}% delivered</span>
                          <span>•</span>
                          <span>{campaign.replyRate.toFixed(1)}% replied</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/campaigns/${campaign.id}/analytics`}>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                  </Link>
                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
