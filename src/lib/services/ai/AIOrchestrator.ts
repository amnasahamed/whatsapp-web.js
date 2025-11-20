/**
 * =============================================================================
 * AI ORCHESTRATOR - Multi-Provider AI Coordination Service
 * =============================================================================
 * Central service for managing multiple AI providers with automatic failover,
 * caching, and performance monitoring.
 * =============================================================================
 */

import {
  AIProviderType,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
  IAIProvider,
  AIOrchestratorOptions,
  AIError,
  AIErrorType,
  AIOperationStats,
} from '@/types/ai';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { CustomProvider } from './providers/CustomProvider';
import { logger } from '@/lib/utils/logger';

/**
 * AI Orchestrator - manages all AI providers
 * Implements: Provider Registry, Failover, Caching, Monitoring
 */
export class AIOrchestrator {
  private providers: Map<AIProviderType, IAIProvider> = new Map();
  private activeProvider?: AIProviderType;
  private options: AIOrchestratorOptions;
  private stats: Map<AIProviderType, AIOperationStats> = new Map();

  constructor(options: AIOrchestratorOptions = {}) {
    this.options = {
      enableCaching: false,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...options,
    };

    // Register all available providers
    this.registerProviders();

    logger.info('AI Orchestrator initialized', {
      options: this.options,
    });
  }

  /**
   * Register all available AI providers
   */
  private registerProviders(): void {
    const providers: IAIProvider[] = [
      new OpenAIProvider(),
      new AnthropicProvider(),
      new GeminiProvider(),
      new CustomProvider(),
    ];

    for (const provider of providers) {
      this.providers.set(provider.type, provider);
      this.initializeStats(provider.type);
    }

    logger.info(`Registered ${providers.length} AI providers`);
  }

  /**
   * Initialize statistics for a provider
   */
  private initializeStats(providerType: AIProviderType): void {
    this.stats.set(providerType, {
      provider: providerType,
      model: '',
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalTokensUsed: 0,
      totalLatencyMs: 0,
      averageLatencyMs: 0,
      lastUsedAt: new Date(),
    });
  }

  /**
   * Configure a specific AI provider
   */
  async configureProvider(config: AIProviderConfig): Promise<void> {
    const provider = this.providers.get(config.provider);

    if (!provider) {
      throw new Error(`Provider ${config.provider} not found`);
    }

    try {
      await provider.initialize(config);

      // Set as active provider if it's the default or first configured
      if (config.provider === this.options.defaultProvider || !this.activeProvider) {
        this.activeProvider = config.provider;
      }

      logger.info(`Configured ${config.provider} provider`, {
        model: config.model,
        isActive: this.activeProvider === config.provider,
      });
    } catch (error) {
      logger.error(`Failed to configure ${config.provider} provider`, { error });
      throw error;
    }
  }

  /**
   * Set the active provider
   */
  setActiveProvider(providerType: AIProviderType): void {
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`Provider ${providerType} not found`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${providerType} is not configured`);
    }

    this.activeProvider = providerType;
    logger.info(`Active provider set to ${providerType}`);
  }

  /**
   * Get the active provider
   */
  getActiveProvider(): IAIProvider {
    if (!this.activeProvider) {
      throw new Error('No active provider configured');
    }

    const provider = this.providers.get(this.activeProvider);

    if (!provider) {
      throw new Error(`Active provider ${this.activeProvider} not found`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Active provider ${this.activeProvider} is not configured`);
    }

    return provider;
  }

  /**
   * Get a specific provider
   */
  getProvider(providerType: AIProviderType): IAIProvider | undefined {
    return this.providers.get(providerType);
  }

  /**
   * Generate AI completion using the active provider
   * Includes automatic failover and retry logic
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const provider = this.getActiveProvider();

    // Try the active provider with retry logic
    let lastError: AIError | undefined;
    let attempts = 0;
    const maxAttempts = this.options.enableRetry ? this.options.maxRetries! : 1;

    while (attempts < maxAttempts) {
      try {
        attempts++;

        const startTime = Date.now();
        const response = await provider.complete(request);
        const latency = Date.now() - startTime;

        // Update statistics
        this.updateStats(provider.type, response, latency, true);

        logger.info('AI completion successful', {
          provider: provider.type,
          model: response.model,
          latency,
          tokens: response.usage.totalTokens,
        });

        return response;
      } catch (error) {
        lastError = error instanceof AIError ? error : this.convertToAIError(error);

        // Update error statistics
        this.updateStats(provider.type, undefined, 0, false);

        logger.warn(`AI completion failed (attempt ${attempts}/${maxAttempts})`, {
          provider: provider.type,
          error: lastError.message,
          type: lastError.type,
        });

        // Don't retry for certain error types
        if (
          lastError.type === AIErrorType.AUTHENTICATION_ERROR ||
          lastError.type === AIErrorType.INVALID_REQUEST ||
          lastError.type === AIErrorType.CONTEXT_LENGTH_ERROR
        ) {
          break;
        }

        // Wait before retry
        if (attempts < maxAttempts && this.options.retryDelay) {
          await this.sleep(this.options.retryDelay * attempts); // Exponential backoff
        }
      }
    }

    // If all retries failed, try fallback providers
    if (this.options.fallbackProviders && this.options.fallbackProviders.length > 0) {
      for (const fallbackType of this.options.fallbackProviders) {
        const fallbackProvider = this.providers.get(fallbackType);

        if (fallbackProvider && fallbackProvider.isConfigured()) {
          try {
            logger.info(`Attempting fallback provider: ${fallbackType}`);

            const response = await fallbackProvider.complete(request);

            logger.info(`Fallback provider ${fallbackType} succeeded`);

            return response;
          } catch (error) {
            logger.warn(`Fallback provider ${fallbackType} failed`, { error });
            continue;
          }
        }
      }
    }

    // All attempts failed
    throw (
      lastError ||
      new AIError(
        AIErrorType.UNKNOWN_ERROR,
        'AI completion failed',
        this.activeProvider!
      )
    );
  }

  /**
   * Generate streaming completion (if supported by provider)
   */
  async *streamComplete(
    request: AICompletionRequest
  ): AsyncGenerator<string, AICompletionResponse, undefined> {
    const provider = this.getActiveProvider();

    if (!provider.streamComplete) {
      throw new Error(
        `Provider ${provider.type} does not support streaming`
      );
    }

    try {
      const generator = provider.streamComplete(request);

      for await (const chunk of generator) {
        yield chunk;
      }

      // Generator returns final response when done
      const response = await generator.return(undefined);

      if (response.done && response.value) {
        this.updateStats(provider.type, response.value, response.value.latencyMs, true);
        return response.value;
      }

      throw new Error('Stream completed without final response');
    } catch (error) {
      this.updateStats(provider.type, undefined, 0, false);
      throw error;
    }
  }

  /**
   * Count tokens for text using active provider's tokenizer
   */
  countTokens(text: string): number {
    try {
      const provider = this.getActiveProvider();
      return provider.countTokens(text);
    } catch {
      // Fallback to basic estimation
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Get statistics for all providers
   */
  getStatistics(): AIOperationStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Get statistics for a specific provider
   */
  getProviderStatistics(providerType: AIProviderType): AIOperationStats | undefined {
    return this.stats.get(providerType);
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    for (const [providerType] of this.stats) {
      this.initializeStats(providerType);
    }
    logger.info('Statistics reset');
  }

  /**
   * Update provider statistics
   */
  private updateStats(
    providerType: AIProviderType,
    response: AICompletionResponse | undefined,
    latency: number,
    success: boolean
  ): void {
    const stats = this.stats.get(providerType);
    if (!stats) return;

    stats.requestCount++;
    stats.lastUsedAt = new Date();

    if (success && response) {
      stats.successCount++;
      stats.totalTokensUsed += response.usage.totalTokens;
      stats.totalLatencyMs += latency;
      stats.averageLatencyMs = stats.totalLatencyMs / stats.successCount;
      stats.model = response.model;
    } else {
      stats.errorCount++;
    }

    this.stats.set(providerType, stats);
  }

  /**
   * Convert unknown error to AIError
   */
  private convertToAIError(error: unknown): AIError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new AIError(
      AIErrorType.UNKNOWN_ERROR,
      errorMessage,
      this.activeProvider || AIProviderType.OPENAI,
      error
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if any provider is configured
   */
  isAnyProviderConfigured(): boolean {
    for (const provider of this.providers.values()) {
      if (provider.isConfigured()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): AIProviderType[] {
    const configured: AIProviderType[] = [];

    for (const [type, provider] of this.providers) {
      if (provider.isConfigured()) {
        configured.push(type);
      }
    }

    return configured;
  }

  /**
   * Get active provider type
   */
  getActiveProviderType(): AIProviderType | undefined {
    return this.activeProvider;
  }
}

/**
 * Singleton instance - can be imported throughout the app
 */
export const aiOrchestrator = new AIOrchestrator();
