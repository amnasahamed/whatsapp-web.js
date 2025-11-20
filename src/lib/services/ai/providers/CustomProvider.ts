/**
 * =============================================================================
 * CUSTOM PROVIDER - Custom LLM Implementation
 * =============================================================================
 * Flexible provider for self-hosted LLMs (Ollama, LM Studio, vLLM, etc.)
 * Supports OpenAI-compatible and custom REST APIs.
 * =============================================================================
 */

import {
  AIProviderType,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderCapabilities,
  AIError,
  AIErrorType,
  AIMessageRole,
} from '@/types/ai';
import { BaseAIProvider } from './BaseProvider';

/**
 * Custom LLM Provider Implementation
 * Works with Ollama, LM Studio, vLLM, and other OpenAI-compatible APIs
 */
export class CustomProvider extends BaseAIProvider {
  private endpoint?: string;
  private headers: Record<string, string> = {};

  constructor() {
    super('Custom LLM', AIProviderType.CUSTOM);
  }

  /**
   * Provider capabilities (configurable based on the actual model)
   */
  get capabilities(): AIProviderCapabilities {
    return {
      supportsStreaming: false, // Can be enabled if endpoint supports it
      supportsFunctionCalling: false,
      supportsVision: false,
      maxContextLength: 4096, // Default, should be configured per model
      supportedModels: ['*'], // Accepts any model name
    };
  }

  /**
   * Initialize Custom LLM client
   */
  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    if (!config.customEndpoint) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'Custom endpoint is required for Custom LLM provider',
        this.type
      );
    }

    this.endpoint = config.customEndpoint;

    // Setup headers
    this.headers = {
      'Content-Type': 'application/json',
    };

    // Add API key to headers if provided
    if (config.apiKey && config.apiKey !== 'not-required') {
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  /**
   * Validate Custom LLM configuration
   */
  protected async validateProviderConfig(config: AIProviderConfig): Promise<boolean> {
    // Endpoint is required
    if (!config.customEndpoint) {
      return false;
    }

    // Validate endpoint URL format
    try {
      new URL(config.customEndpoint);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Generate completion using Custom LLM API
   */
  protected async generateCompletion(
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    if (!this.endpoint) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'Custom LLM endpoint not configured',
        this.type
      );
    }

    const params = this.mergeConfig(request);

    try {
      // Try OpenAI-compatible format first (works with Ollama, LM Studio, vLLM)
      const body = this.buildOpenAICompatibleRequest(request, params);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config?.timeout || 60000),
      });

      if (!response.ok) {
        throw new Error(
          `Custom LLM API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Try to parse OpenAI-compatible response format
      return this.parseOpenAICompatibleResponse(data, params);
    } catch (error) {
      // If OpenAI-compatible format fails, you can try other formats here
      throw this.handleCustomError(error);
    }
  }

  /**
   * Build OpenAI-compatible request body
   * This format works with most self-hosted LLM servers
   */
  private buildOpenAICompatibleRequest(
    request: AICompletionRequest,
    params: ReturnType<typeof this.mergeConfig>
  ) {
    const messages = this.buildMessages(request);

    return {
      model: this.config!.model,
      messages: messages.map((msg) => ({
        role: this.mapRole(msg.role),
        content: this.sanitizeText(msg.content),
      })),
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      frequency_penalty: params.frequencyPenalty,
      presence_penalty: params.presencePenalty,
      stop: request.stopSequences,
      stream: false,
    };
  }

  /**
   * Parse OpenAI-compatible response
   */
  private parseOpenAICompatibleResponse(
    data: any,
    params: ReturnType<typeof this.mergeConfig>
  ): AICompletionResponse {
    // OpenAI format
    if (data.choices && Array.isArray(data.choices)) {
      const choice = data.choices[0];

      return {
        content: choice.message?.content || choice.text || '',
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: data.model || this.config!.model,
        provider: this.type,
        latencyMs: 0,
        metadata: {
          id: data.id,
          created: data.created,
        },
      };
    }

    // Ollama format
    if (data.response) {
      return {
        content: data.response,
        finishReason: data.done ? 'stop' : 'error',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: data.model || this.config!.model,
        provider: this.type,
        latencyMs: 0,
        metadata: {
          context: data.context,
        },
      };
    }

    // LM Studio and other formats
    if (data.text || data.content) {
      return {
        content: data.text || data.content,
        finishReason: 'stop',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: this.config!.model,
        provider: this.type,
        latencyMs: 0,
      };
    }

    throw new AIError(
      AIErrorType.API_ERROR,
      'Unsupported response format from Custom LLM',
      this.type
    );
  }

  /**
   * Map our role to OpenAI-compatible role
   */
  private mapRole(role: AIMessageRole): 'system' | 'user' | 'assistant' {
    switch (role) {
      case AIMessageRole.SYSTEM:
        return 'system';
      case AIMessageRole.ASSISTANT:
        return 'assistant';
      case AIMessageRole.USER:
      case AIMessageRole.FUNCTION:
      default:
        return 'user';
    }
  }

  /**
   * Map finish reason
   */
  private mapFinishReason(
    reason: string | null | undefined
  ): AICompletionResponse['finishReason'] {
    if (!reason) return 'stop';

    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
      case 'max_tokens':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Enhanced error handling for Custom LLM errors
   */
  private handleCustomError(error: unknown): AIError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Network errors
    if (
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND')
    ) {
      return new AIError(
        AIErrorType.NETWORK_ERROR,
        `Cannot connect to Custom LLM endpoint: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return new AIError(
        AIErrorType.TIMEOUT_ERROR,
        `Custom LLM request timeout: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return new AIError(
        AIErrorType.AUTHENTICATION_ERROR,
        `Custom LLM authentication failed: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Rate limit errors
    if (errorMessage.includes('429')) {
      return new AIError(
        AIErrorType.RATE_LIMIT_ERROR,
        `Custom LLM rate limit exceeded: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Use base error handling
    return this.handleError(error);
  }

  /**
   * Token counting for Custom LLM
   */
  countTokens(text: string): number {
    // Generic approximation
    const words = text.split(/\s+/).length;
    const chars = text.length;
    return Math.ceil(Math.max(chars / 4, words * 0.75));
  }
}
