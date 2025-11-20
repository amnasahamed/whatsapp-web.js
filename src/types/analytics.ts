/**
 * =============================================================================
 * ANALYTICS TYPES - Analytics and Reporting Type Definitions
 * =============================================================================
 * Types for metrics, charts, and performance tracking
 * =============================================================================
 */

export enum MetricType {
  MESSAGE_VOLUME = 'MESSAGE_VOLUME',
  RESPONSE_TIME = 'RESPONSE_TIME',
  CONVERSATION_COUNT = 'CONVERSATION_COUNT',
  CONTACT_GROWTH = 'CONTACT_GROWTH',
  USER_PERFORMANCE = 'USER_PERFORMANCE',
  CAMPAIGN_PERFORMANCE = 'CAMPAIGN_PERFORMANCE',
  AI_USAGE = 'AI_USAGE',
}

export enum TimeRange {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM = 'CUSTOM',
}

// Overview metrics
export interface OverviewMetrics {
  totalMessages: number;
  totalMessagesChange: number; // Percentage change
  activeConversations: number;
  activeConversationsChange: number;
  averageResponseTime: number; // In seconds
  averageResponseTimeChange: number;
  totalContacts: number;
  totalContactsChange: number;
  resolvedConversations: number;
  resolutionRate: number;
  customerSatisfaction: number; // 0-100
}

// Message analytics
export interface MessageAnalytics {
  timeRange: TimeRange;
  customRange?: { start: Date; end: Date };
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  messagesByDay: Array<{
    date: string;
    inbound: number;
    outbound: number;
    total: number;
  }>;
  messagesByHour: Array<{
    hour: number;
    count: number;
  }>;
  messagesByType: Array<{
    type: 'text' | 'image' | 'video' | 'document' | 'audio';
    count: number;
  }>;
  topContacts: Array<{
    contactId: string;
    contactName: string;
    messageCount: number;
  }>;
}

// Response time analytics
export interface ResponseTimeAnalytics {
  timeRange: TimeRange;
  averageResponseTime: number; // seconds
  medianResponseTime: number;
  firstResponseTime: number;
  responseTimeByDay: Array<{
    date: string;
    average: number;
    median: number;
  }>;
  responseTimeDistribution: Array<{
    range: string; // e.g., "0-1min", "1-5min"
    count: number;
  }>;
  byUser: Array<{
    userId: string;
    userName: string;
    averageResponseTime: number;
    totalResponses: number;
  }>;
}

// Conversation analytics
export interface ConversationAnalytics {
  timeRange: TimeRange;
  totalConversations: number;
  newConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  averageConversationDuration: number; // minutes
  conversationsByStatus: Array<{
    status: string;
    count: number;
  }>;
  conversationsByTag: Array<{
    tag: string;
    count: number;
  }>;
  conversationsBySource: Array<{
    source: string;
    count: number;
  }>;
}

// Contact analytics
export interface ContactAnalytics {
  timeRange: TimeRange;
  totalContacts: number;
  newContacts: number;
  activeContacts: number; // Contacted in time range
  contactGrowth: Array<{
    date: string;
    new: number;
    total: number;
  }>;
  contactsByTag: Array<{
    tag: string;
    count: number;
  }>;
  contactsBySource: Array<{
    source: string;
    count: number;
  }>;
  topEngagedContacts: Array<{
    contactId: string;
    contactName: string;
    messageCount: number;
    lastMessageAt: Date;
  }>;
}

// User performance analytics
export interface UserPerformanceAnalytics {
  timeRange: TimeRange;
  byUser: Array<{
    userId: string;
    userName: string;
    messagesHandled: number;
    conversationsHandled: number;
    averageResponseTime: number;
    resolutionRate: number;
    customerSatisfaction: number;
    activeHours: number;
  }>;
  teamAverages: {
    messagesPerUser: number;
    conversationsPerUser: number;
    averageResponseTime: number;
    resolutionRate: number;
  };
}

// Campaign analytics (imported from campaign types)
export interface CampaignMetrics {
  timeRange: TimeRange;
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalRecipients: number;
  deliveryRate: number;
  openRate: number;
  replyRate: number;
  campaignsByStatus: Array<{
    status: string;
    count: number;
  }>;
  topPerformingCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    recipients: number;
    deliveryRate: number;
    replyRate: number;
  }>;
}

// AI usage analytics
export interface AIUsageAnalytics {
  timeRange: TimeRange;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number; // milliseconds
  totalTokensUsed: number;
  costEstimate: number; // USD
  byProvider: Array<{
    provider: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byModel: Array<{
    model: string;
    requests: number;
    averageLatency: number;
  }>;
  usageByDay: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
}

// Chart data types
export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface PieChartData {
  labels: string[];
  data: number[];
  colors?: string[];
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

// Dashboard widget configuration
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  title: string;
  metricType?: MetricType;
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  timeRange: TimeRange;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval?: number; // seconds
}

// Export types
export interface AnalyticsExport {
  format: 'csv' | 'xlsx' | 'pdf';
  metrics: MetricType[];
  timeRange: TimeRange;
  customRange?: { start: Date; end: Date };
  includeCharts: boolean;
}
