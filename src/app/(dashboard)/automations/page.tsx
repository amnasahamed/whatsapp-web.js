/**
 * =============================================================================
 * AUTOMATIONS PAGE - Automation Management
 * =============================================================================
 * List and manage all automations with status, stats, and actions
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
import { Search, Plus, Play, Pause, MoreVertical, Zap, TrendingUp } from 'lucide-react';
import { AutomationStatus } from '@/types/automation';

// Mock data
const mockAutomations = [
  {
    id: '1',
    name: 'Welcome New Customers',
    description: 'Send welcome message to new contacts',
    status: AutomationStatus.ACTIVE,
    trigger: 'Contact Added',
    runCount: 342,
    successRate: 98.5,
    lastRunAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Auto-Reply Keywords',
    description: 'Reply to common questions automatically',
    status: AutomationStatus.ACTIVE,
    trigger: 'Keyword Match',
    runCount: 1247,
    successRate: 95.2,
    lastRunAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Lead Qualification',
    description: 'Ask qualifying questions and tag leads',
    status: AutomationStatus.ACTIVE,
    trigger: 'Message Received',
    runCount: 89,
    successRate: 92.1,
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Follow-up Idle Conversations',
    description: 'Send follow-up after 24 hours of inactivity',
    status: AutomationStatus.INACTIVE,
    trigger: 'Conversation Idle',
    runCount: 156,
    successRate: 87.8,
    lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const statusColors: Record<AutomationStatus, 'default' | 'secondary' | 'destructive'> = {
  [AutomationStatus.ACTIVE]: 'default',
  [AutomationStatus.INACTIVE]: 'secondary',
  [AutomationStatus.DRAFT]: 'secondary',
};

export default function AutomationsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAutomations = mockAutomations.filter((automation) =>
    automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    automation.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Create and manage no-code automation workflows
          </p>
        </div>
        <Link href="/automations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAutomations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAutomations.filter((a) => a.status === AutomationStatus.ACTIVE).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Runs (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAutomations.reduce((sum, a) => sum + a.runCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(mockAutomations.reduce((sum, a) => sum + a.successRate, 0) / mockAutomations.length).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Automations</CardTitle>
              <CardDescription>Manage your automation workflows</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search automations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Automations List */}
          <div className="space-y-4">
            {filteredAutomations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{automation.name}</h3>
                      <Badge variant={statusColors[automation.status]}>
                        {automation.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{automation.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Trigger: {automation.trigger}</span>
                      <span>•</span>
                      <span>{automation.runCount} runs</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {automation.successRate}% success
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={automation.status === AutomationStatus.ACTIVE ? '' : ''}
                  >
                    {automation.status === AutomationStatus.ACTIVE ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Link href={`/automations/${automation.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Templates</CardTitle>
          <CardDescription>Start with pre-built automation templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: 'Welcome Sequence', description: 'Greet new contacts automatically' },
              { name: 'FAQ Auto-Reply', description: 'Answer common questions' },
              { name: 'Lead Scoring', description: 'Qualify and tag leads' },
            ].map((template, idx) => (
              <Card key={idx} className="cursor-pointer transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
