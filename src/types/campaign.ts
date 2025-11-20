/**
 * =============================================================================
 * CAMPAIGN TYPES - Campaign Management Type Definitions
 * =============================================================================
 * Types for broadcast campaigns, audience targeting, and performance tracking
 * =============================================================================
 */

export enum CampaignType {
  BROADCAST = 'BROADCAST',
  DRIP = 'DRIP',
  TRANSACTIONAL = 'TRANSACTIONAL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum AudienceFilterType {
  ALL_CONTACTS = 'ALL_CONTACTS',
  TAG = 'TAG',
  CUSTOM_FILTER = 'CUSTOM_FILTER',
  UPLOADED_LIST = 'UPLOADED_LIST',
}

// Audience targeting
export interface TagAudienceFilter {
  type: AudienceFilterType.TAG;
  tagIds: string[];
  matchType: 'any' | 'all';
}

export interface CustomAudienceFilter {
  type: AudienceFilterType.CUSTOM_FILTER;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt';
    value: string | number;
  }>;
}

export type AudienceFilter =
  | { type: AudienceFilterType.ALL_CONTACTS }
  | TagAudienceFilter
  | CustomAudienceFilter
  | { type: AudienceFilterType.UPLOADED_LIST; contactIds: string[] };

// Campaign content
export interface CampaignMessage {
  type: 'text' | 'template' | 'media';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  templateId?: string;
  variables?: Record<string, string>;
}

// Scheduling
export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: Date;
  timezone?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  throttle?: {
    messagesPerMinute: number;
    messagesPerHour: number;
  };
}

// Main campaign structure
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  accountId: string;
  message: CampaignMessage;
  audience: AudienceFilter;
  schedule: CampaignSchedule;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Statistics
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount: number;
  optOutCount: number;
}

// Campaign recipient tracking
export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'opted_out';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  repliedAt?: Date;
  failureReason?: string;
}

// Campaign analytics
export interface CampaignAnalytics {
  campaignId: string;
  overview: {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    replyRate: number;
    optOutRate: number;
  };
  timeline: Array<{
    timestamp: Date;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
  }>;
  topReplies: Array<{
    message: string;
    count: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
  }>;
  geographicBreakdown: Array<{
    country: string;
    count: number;
  }>;
}

// Campaign templates
export interface CampaignTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'marketing' | 'transactional' | 'notification';
  message: CampaignMessage;
  variables: Array<{
    name: string;
    description: string;
    defaultValue?: string;
  }>;
  previewUrl?: string;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
}

// Drip campaign specific
export interface DripCampaignStep {
  id: string;
  order: number;
  message: CampaignMessage;
  delayDays: number;
  conditions?: Array<{
    type: 'replied' | 'clicked' | 'not_replied';
    action: 'skip' | 'end_campaign';
  }>;
}

export interface DripCampaign extends Campaign {
  type: CampaignType.DRIP;
  steps: DripCampaignStep[];
}
