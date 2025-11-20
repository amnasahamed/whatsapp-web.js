/**
 * =============================================================================
 * AUTOMATION TYPES - Automation Builder Type Definitions
 * =============================================================================
 * Types for no-code automation workflows with triggers, conditions, and actions
 * =============================================================================
 */

export enum AutomationTriggerType {
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  KEYWORD_MATCH = 'KEYWORD_MATCH',
  CONTACT_ADDED = 'CONTACT_ADDED',
  TAG_ADDED = 'TAG_ADDED',
  SCHEDULE = 'SCHEDULE',
  WEBHOOK = 'WEBHOOK',
  CONVERSATION_IDLE = 'CONVERSATION_IDLE',
}

export enum AutomationActionType {
  SEND_MESSAGE = 'SEND_MESSAGE',
  SEND_TEMPLATE = 'SEND_TEMPLATE',
  TAG_CONTACT = 'TAG_CONTACT',
  ASSIGN_TO_USER = 'ASSIGN_TO_USER',
  ADD_TO_CAMPAIGN = 'ADD_TO_CAMPAIGN',
  CALL_AI = 'CALL_AI',
  SEND_WEBHOOK = 'SEND_WEBHOOK',
  ADD_DELAY = 'ADD_DELAY',
  MARK_AS_RESOLVED = 'MARK_AS_RESOLVED',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
}

export enum AutomationConditionType {
  KEYWORD_CONTAINS = 'KEYWORD_CONTAINS',
  CONTACT_HAS_TAG = 'CONTACT_HAS_TAG',
  MESSAGE_COUNT = 'MESSAGE_COUNT',
  TIME_OF_DAY = 'TIME_OF_DAY',
  DAY_OF_WEEK = 'DAY_OF_WEEK',
  CUSTOM_FIELD = 'CUSTOM_FIELD',
}

export enum AutomationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

// Trigger configurations
export interface MessageReceivedTrigger {
  type: AutomationTriggerType.MESSAGE_RECEIVED;
  accountId?: string; // All accounts if not specified
}

export interface KeywordMatchTrigger {
  type: AutomationTriggerType.KEYWORD_MATCH;
  keywords: string[];
  matchType: 'exact' | 'contains' | 'starts_with' | 'ends_with';
  caseSensitive: boolean;
}

export interface ScheduleTrigger {
  type: AutomationTriggerType.SCHEDULE;
  schedule: string; // Cron expression
  timezone: string;
}

export interface ConversationIdleTrigger {
  type: AutomationTriggerType.CONVERSATION_IDLE;
  idleMinutes: number;
}

export type TriggerConfig =
  | MessageReceivedTrigger
  | KeywordMatchTrigger
  | ScheduleTrigger
  | ConversationIdleTrigger
  | { type: AutomationTriggerType.CONTACT_ADDED }
  | { type: AutomationTriggerType.TAG_ADDED; tagId: string }
  | { type: AutomationTriggerType.WEBHOOK; webhookId: string };

// Action configurations
export interface SendMessageAction {
  type: AutomationActionType.SEND_MESSAGE;
  message: string;
  mediaUrl?: string;
}

export interface TagContactAction {
  type: AutomationActionType.TAG_CONTACT;
  tagId: string;
}

export interface AssignToUserAction {
  type: AutomationActionType.ASSIGN_TO_USER;
  userId: string;
}

export interface CallAIAction {
  type: AutomationActionType.CALL_AI;
  prompt: string;
  model?: string;
  sendResponse: boolean;
}

export interface AddDelayAction {
  type: AutomationActionType.ADD_DELAY;
  delaySeconds: number;
}

export interface SendWebhookAction {
  type: AutomationActionType.SEND_WEBHOOK;
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
}

export type ActionConfig =
  | SendMessageAction
  | TagContactAction
  | AssignToUserAction
  | CallAIAction
  | AddDelayAction
  | SendWebhookAction
  | { type: AutomationActionType.SEND_TEMPLATE; templateId: string }
  | { type: AutomationActionType.ADD_TO_CAMPAIGN; campaignId: string }
  | { type: AutomationActionType.MARK_AS_RESOLVED }
  | { type: AutomationActionType.SEND_NOTIFICATION; message: string };

// Condition configurations
export interface KeywordCondition {
  type: AutomationConditionType.KEYWORD_CONTAINS;
  keywords: string[];
  matchType: 'any' | 'all';
}

export interface TagCondition {
  type: AutomationConditionType.CONTACT_HAS_TAG;
  tagIds: string[];
  matchType: 'any' | 'all';
}

export interface MessageCountCondition {
  type: AutomationConditionType.MESSAGE_COUNT;
  operator: 'gt' | 'lt' | 'eq';
  count: number;
}

export interface TimeOfDayCondition {
  type: AutomationConditionType.TIME_OF_DAY;
  startTime: string; // HH:mm format
  endTime: string;
}

export type ConditionConfig =
  | KeywordCondition
  | TagCondition
  | MessageCountCondition
  | TimeOfDayCondition
  | { type: AutomationConditionType.DAY_OF_WEEK; days: number[] }
  | { type: AutomationConditionType.CUSTOM_FIELD; field: string; operator: string; value: string };

// Node types for visual builder
export interface AutomationNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  position: { x: number; y: number };
  data: TriggerConfig | ConditionConfig | ActionConfig;
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  label?: string; // For condition branches (e.g., "Yes", "No")
}

// Main automation structure
export interface Automation {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  trigger: TriggerConfig;
  conditions: ConditionConfig[];
  actions: ActionConfig[];
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
}

// Automation execution
export interface AutomationExecution {
  id: string;
  automationId: string;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  context: {
    messageId?: string;
    contactId?: string;
    conversationId?: string;
    [key: string]: any;
  };
  logs: AutomationLog[];
}

export interface AutomationLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

// Analytics
export interface AutomationAnalytics {
  automationId: string;
  totalRuns: number;
  successRate: number;
  averageExecutionTime: number;
  runsByDay: Array<{ date: string; count: number }>;
  actionBreakdown: Array<{ action: string; count: number }>;
}
