/**
 * =============================================================================
 * NEW CAMPAIGN PAGE - Campaign Creation Wizard
 * =============================================================================
 * Step-by-step wizard for creating broadcast campaigns
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Send, Calendar, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    message: '',
    audienceType: 'all',
    scheduleType: 'immediate',
    scheduledAt: '',
  });

  const handleCreate = () => {
    // TODO: Create campaign via tRPC
    console.log('Creating campaign:', campaignData);
    router.push('/campaigns');
  };

  const steps = [
    { number: 1, title: 'Campaign Details', icon: MessageSquare },
    { number: 2, title: 'Select Audience', icon: Users },
    { number: 3, title: 'Schedule', icon: Calendar },
    { number: 4, title: 'Review & Send', icon: Send },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground">
              Send broadcast messages to your contacts
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.number} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        step >= s.number
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-sm font-medium">{s.title}</p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`mx-4 h-[2px] flex-1 ${step > s.number ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Give your campaign a name and write your message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Name</label>
              <Input
                placeholder="e.g., Summer Sale 2024"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="min-h-[150px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Write your message here..."
                value={campaignData.message}
                onChange={(e) => setCampaignData({ ...campaignData, message: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {campaignData.message.length} characters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Audience</CardTitle>
            <CardDescription>Choose who will receive this campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Contacts', count: 1247 },
                { value: 'customers', label: 'Customers Only', count: 856 },
                { value: 'leads', label: 'Leads Only', count: 391 },
                { value: 'custom', label: 'Custom Filter', count: 0 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCampaignData({ ...campaignData, audienceType: option.value })}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                    campaignData.audienceType === option.value ? 'border-primary bg-accent' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{option.label}</p>
                    {option.count > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {option.count.toLocaleString()} contacts
                      </p>
                    )}
                  </div>
                  {campaignData.audienceType === option.value && (
                    <Badge>Selected</Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Delivery</CardTitle>
            <CardDescription>Choose when to send this campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {[
                { value: 'immediate', label: 'Send Immediately', description: 'Start sending right away' },
                { value: 'scheduled', label: 'Schedule for Later', description: 'Pick a specific date and time' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCampaignData({ ...campaignData, scheduleType: option.value })}
                  className={`flex w-full items-start justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                    campaignData.scheduleType === option.value ? 'border-primary bg-accent' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {campaignData.scheduleType === option.value && (
                    <Badge>Selected</Badge>
                  )}
                </button>
              ))}
            </div>

            {campaignData.scheduleType === 'scheduled' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={campaignData.scheduledAt}
                  onChange={(e) => setCampaignData({ ...campaignData, scheduledAt: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Send</CardTitle>
            <CardDescription>Review your campaign before sending</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium">Campaign Name</h3>
              <p>{campaignData.name || 'Untitled Campaign'}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Message</h3>
              <div className="rounded-lg border p-4 text-sm">
                {campaignData.message || 'No message'}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Audience</h3>
              <p className="capitalize">{campaignData.audienceType.replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Schedule</h3>
              <p className="capitalize">{campaignData.scheduleType === 'immediate' ? 'Send immediately' : `Scheduled for ${campaignData.scheduledAt}`}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(Math.min(4, step + 1))}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate}>
            <Send className="mr-2 h-4 w-4" />
            Send Campaign
          </Button>
        )}
      </div>
    </div>
  );
}
