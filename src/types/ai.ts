/**
 * =============================================================================
 * AI TYPES - Type Definitions for AI/LLM Integration
 * =============================================================================
 * Comprehensive type system for multi-provider LLM integration with strict
 * type safety and extensibility for custom providers.
 * =============================================================================
 */

/**
 * Supported AI providers
 */
export enum AIProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  CUSTOM = 'custom',
}

/**
 * AI message role types
 */
export enum AIMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
}

/**
 * Single message in conversation history
 */
export interface AIMessage {
  role: AIMessageRole;
  content: string;
  name?: string; // For function calls
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/**
 * Configuration for AI provider
 */
export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  customEndpoint?: string; // For custom providers
  timeout?: number;
  [key: string]: unknown; // Allow additional provider-specific options
}

/**
 * Request parameters for generating AI completions
 */
export interface AICompletionRequest {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Usage statistics from AI provider
 */
export interface AIUsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Response from AI completion
 */
export interface AICompletionResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call' | 'error';
  usage: AIUsageStats;
  model: string;
  provider: AIProviderType;
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

/**
 * Error types for AI operations
 */
export enum AIErrorType {
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  CONTEXT_LENGTH_ERROR = 'context_length_error',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  INVALID_REQUEST = 'invalid_request',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Custom error class for AI operations
 */
export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public provider: AIProviderType,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AIError';
    Object.setPrototypeOf(this, AIError.prototype);
  }
}

/**
 * Context for maintaining conversation state
 */
export interface ConversationContext {
  conversationId: string;
  contactId: string;
  messages: AIMessage[];
  metadata?: {
    contactName?: string;
    contactTags?: string[];
    conversationStartedAt?: Date;
    lastMessageAt?: Date;
    messageCount?: number;
    [key: string]: unknown;
  };
}

/**
 * Configuration for conversation context management
 */
export interface ContextManagerConfig {
  maxMessages?: number; // Maximum messages to keep in context
  maxTokens?: number; // Maximum tokens for context
  summarizeOldMessages?: boolean; // Summarize old messages to save tokens
  includeSystemInfo?: boolean; // Include system information in context
}

/**
 * AI provider capabilities
 */
export interface AIProviderCapabilities {
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  maxContextLength: number;
  supportedModels: string[];
}

/**
 * Base interface that all AI providers must implement
 */
export interface IAIProvider {
  readonly name: string;
  readonly type: AIProviderType;
  readonly capabilities: AIProviderCapabilities;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: AIProviderConfig): Promise<void>;

  /**
   * Generate a completion
   */
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * Stream a completion (if supported)
   */
  streamComplete?(
    request: AICompletionRequest
  ): AsyncGenerator<string, AICompletionResponse, undefined>;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Validate the configuration
   */
  validateConfig(config: AIProviderConfig): Promise<boolean>;

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<AIProviderConfig, 'apiKey'>;

  /**
   * Count tokens in text (provider-specific tokenization)
   */
  countTokens(text: string): number;

  /**
   * Get model information
   */
  getModelInfo(): {
    model: string;
    maxTokens: number;
    contextWindow: number;
  };
}

/**
 * Options for AI orchestrator
 */
export interface AIOrchestratorOptions {
  defaultProvider?: AIProviderType;
  fallbackProviders?: AIProviderType[];
  enableCaching?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Statistics for AI operations
 */
export interface AIOperationStats {
  provider: AIProviderType;
  model: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  totalTokensUsed: number;
  totalLatencyMs: number;
  averageLatencyMs: number;
  lastUsedAt: Date;
}

/**
 * Prompt template variables
 */
export interface PromptVariables {
  contactName?: string;
  contactPhone?: string;
  businessName?: string;
  currentDate?: string;
  currentTime?: string;
  conversationHistory?: string;
  customFields?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Prompt template configuration
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[]; // List of variable names used in template
  examples?: Array<{
    input: string;
    output: string;
  }>;
  metadata?: Record<string, unknown>;
}
