/**
 * =============================================================================
 * BASE AI PROVIDER - Abstract Base Class
 * =============================================================================
 * Abstract base class implementing common functionality for all AI providers.
 * Follows the Template Method pattern for extensibility.
 * =============================================================================
 */

import {
  AIProviderType,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
  IAIProvider,
  AIProviderCapabilities,
  AIError,
  AIErrorType,
} from '@/types/ai';

/**
 * Abstract base class for all AI providers
 * Implements common functionality and enforces interface compliance
 */
export abstract class BaseAIProvider implements IAIProvider {
  protected config?: AIProviderConfig;
  protected initialized = false;

  constructor(
    public readonly name: string,
    public readonly type: AIProviderType
  ) {}

  /**
   * Provider capabilities - must be implemented by each provider
   */
  abstract get capabilities(): AIProviderCapabilities;

  /**
   * Initialize the provider with configuration
   */
  async initialize(config: AIProviderConfig): Promise<void> {
    // Validate configuration
    const isValid = await this.validateConfig(config);
    if (!isValid) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        `Invalid configuration for ${this.name} provider`,
        this.type
      );
    }

    this.config = config;
    this.initialized = true;

    // Provider-specific initialization
    await this.initializeProvider(config);
  }

  /**
   * Provider-specific initialization logic
   * Override this in subclasses if needed
   */
  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    // Default implementation - can be overridden
  }

  /**
   * Generate a completion
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.initialized || !this.config) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        `Provider ${this.name} is not initialized`,
        this.type
      );
    }

    const startTime = Date.now();

    try {
      // Call provider-specific implementation
      const response = await this.generateCompletion(request);

      // Calculate latency
      response.latencyMs = Date.now() - startTime;

      // Add provider info
      response.provider = this.type;
      response.model = this.config.model;

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Provider-specific completion logic - must be implemented
   */
  protected abstract generateCompletion(
    request: AICompletionRequest
  ): Promise<AICompletionResponse>;

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return this.initialized && !!this.config && !!this.config.apiKey;
  }

  /**
   * Validate configuration
   */
  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    // Basic validation
    if (!config.apiKey || config.apiKey.trim() === '') {
      return false;
    }

    if (!config.model || config.model.trim() === '') {
      return false;
    }

    // Provider-specific validation
    return this.validateProviderConfig(config);
  }

  /**
   * Provider-specific validation logic
   * Override this in subclasses for custom validation
   */
  protected async validateProviderConfig(config: AIProviderConfig): Promise<boolean> {
    return true; // Default: pass validation
  }

  /**
   * Get current configuration without sensitive data
   */
  getConfig(): Omit<AIProviderConfig, 'apiKey'> {
    if (!this.config) {
      throw new Error('Provider not initialized');
    }

    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Count tokens - default implementation (approximate)
   * Override in subclasses for provider-specific tokenization
   */
  countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    // This should be overridden by providers with proper tokenizers
    return Math.ceil(text.length / 4);
  }

  /**
   * Get model information
   */
  getModelInfo() {
    if (!this.config) {
      throw new Error('Provider not initialized');
    }

    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens || 2000,
      contextWindow: this.capabilities.maxContextLength,
    };
  }

  /**
   * Error handling with standardized error types
   */
  protected handleError(error: unknown): AIError {
    if (error instanceof AIError) {
      return error;
    }

    // Convert known error types
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Detect error type from message
    if (errorMessage.includes('authentication') || errorMessage.includes('api key')) {
      return new AIError(
        AIErrorType.AUTHENTICATION_ERROR,
        `Authentication failed: ${errorMessage}`,
        this.type,
        error
      );
    }

    if (errorMessage.includes('rate limit')) {
      return new AIError(
        AIErrorType.RATE_LIMIT_ERROR,
        `Rate limit exceeded: ${errorMessage}`,
        this.type,
        error
      );
    }

    if (
      errorMessage.includes('context length') ||
      errorMessage.includes('maximum context') ||
      errorMessage.includes('token limit')
    ) {
      return new AIError(
        AIErrorType.CONTEXT_LENGTH_ERROR,
        `Context length exceeded: ${errorMessage}`,
        this.type,
        error
      );
    }

    if (errorMessage.includes('timeout')) {
      return new AIError(
        AIErrorType.TIMEOUT_ERROR,
        `Request timeout: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Default to API error
    return new AIError(
      AIErrorType.API_ERROR,
      `API error: ${errorMessage}`,
      this.type,
      error
    );
  }

  /**
   * Build messages array with system prompt
   */
  protected buildMessages(request: AICompletionRequest) {
    const messages = [...request.messages];

    // Prepend system prompt if provided
    if (request.systemPrompt) {
      messages.unshift({
        role: 'system' as const,
        content: request.systemPrompt,
      });
    }

    return messages;
  }

  /**
   * Merge configuration with request parameters
   */
  protected mergeConfig(request: AICompletionRequest): Required<
    Pick<
      AIProviderConfig,
      'maxTokens' | 'temperature' | 'topP' | 'frequencyPenalty' | 'presencePenalty'
    >
  > {
    return {
      maxTokens: request.maxTokens ?? this.config?.maxTokens ?? 2000,
      temperature: request.temperature ?? this.config?.temperature ?? 0.7,
      topP: request.topP ?? this.config?.topP ?? 1.0,
      frequencyPenalty: this.config?.frequencyPenalty ?? 0.0,
      presencePenalty: this.config?.presencePenalty ?? 0.0,
    };
  }

  /**
   * Sanitize and prepare text for API calls
   */
  protected sanitizeText(text: string): string {
    return text.trim().replace(/\r\n/g, '\n');
  }
}
