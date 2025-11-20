/**
 * =============================================================================
 * OPENAI PROVIDER - OpenAI GPT Implementation
 * =============================================================================
 * Production-ready OpenAI integration with comprehensive error handling,
 * retry logic, and performance optimization.
 * =============================================================================
 */

import OpenAI from 'openai';
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
 * OpenAI Provider Implementation
 * Supports GPT-4, GPT-4 Turbo, and GPT-3.5 models
 */
export class OpenAIProvider extends BaseAIProvider {
  private client?: OpenAI;

  constructor() {
    super('OpenAI', AIProviderType.OPENAI);
  }

  /**
   * Provider capabilities
   */
  get capabilities(): AIProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      maxContextLength: 128000, // GPT-4 Turbo
      supportedModels: [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4-turbo-preview',
        'gpt-4-0125-preview',
        'gpt-4-1106-preview',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
      ],
    };
  }

  /**
   * Initialize OpenAI client
   */
  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 60000,
      maxRetries: 2,
    });
  }

  /**
   * Validate OpenAI-specific configuration
   */
  protected async validateProviderConfig(config: AIProviderConfig): Promise<boolean> {
    // Check if API key format is valid (starts with sk-)
    if (!config.apiKey.startsWith('sk-')) {
      return false;
    }

    // Validate model is supported
    if (!this.capabilities.supportedModels.includes(config.model)) {
      console.warn(`Model ${config.model} may not be supported. Proceeding anyway.`);
    }

    return true;
  }

  /**
   * Generate completion using OpenAI API
   */
  protected async generateCompletion(
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    if (!this.client) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'OpenAI client not initialized',
        this.type
      );
    }

    const messages = this.buildMessages(request);
    const params = this.mergeConfig(request);

    try {
      // Convert our message format to OpenAI format
      const openaiMessages = messages.map((msg) => ({
        role: this.mapRoleToOpenAI(msg.role),
        content: this.sanitizeText(msg.content),
        ...(msg.name && { name: msg.name }),
      }));

      const response = await this.client.chat.completions.create({
        model: this.config!.model,
        messages: openaiMessages as OpenAI.Chat.ChatCompletionMessageParam[],
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stop: request.stopSequences,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new AIError(
          AIErrorType.API_ERROR,
          'No completion returned from OpenAI',
          this.type
        );
      }

      return {
        content: choice.message.content || '',
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        provider: this.type,
        latencyMs: 0, // Will be set by base class
        metadata: {
          id: response.id,
          created: response.created,
          systemFingerprint: response.system_fingerprint,
        },
      };
    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  /**
   * Stream completion (optional - for future implementation)
   */
  async *streamComplete(
    request: AICompletionRequest
  ): AsyncGenerator<string, AICompletionResponse, undefined> {
    if (!this.client) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'OpenAI client not initialized',
        this.type
      );
    }

    const messages = this.buildMessages(request);
    const params = this.mergeConfig(request);

    const openaiMessages = messages.map((msg) => ({
      role: this.mapRoleToOpenAI(msg.role),
      content: this.sanitizeText(msg.content),
    }));

    const stream = await this.client.chat.completions.create({
      model: this.config!.model,
      messages: openaiMessages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      stream: true,
    });

    let fullContent = '';
    let finishReason: AICompletionResponse['finishReason'] = 'stop';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        yield delta;
      }

      if (chunk.choices[0]?.finish_reason) {
        finishReason = this.mapFinishReason(chunk.choices[0].finish_reason);
      }
    }

    return {
      content: fullContent,
      finishReason,
      usage: {
        promptTokens: this.countTokens(messages.map((m) => m.content).join(' ')),
        completionTokens: this.countTokens(fullContent),
        totalTokens: 0, // Will be calculated
      },
      model: this.config!.model,
      provider: this.type,
      latencyMs: 0,
    };
  }

  /**
   * Map our role enum to OpenAI role
   */
  private mapRoleToOpenAI(role: AIMessageRole): 'system' | 'user' | 'assistant' | 'function' {
    const mapping: Record<AIMessageRole, 'system' | 'user' | 'assistant' | 'function'> = {
      [AIMessageRole.SYSTEM]: 'system',
      [AIMessageRole.USER]: 'user',
      [AIMessageRole.ASSISTANT]: 'assistant',
      [AIMessageRole.FUNCTION]: 'function',
    };
    return mapping[role];
  }

  /**
   * Map OpenAI finish reason to our format
   */
  private mapFinishReason(
    reason: string | null
  ): AICompletionResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'function_call':
        return 'function_call';
      default:
        return 'stop';
    }
  }

  /**
   * Enhanced error handling for OpenAI-specific errors
   */
  private handleOpenAIError(error: unknown): AIError {
    if (error instanceof OpenAI.APIError) {
      // Rate limit error
      if (error.status === 429) {
        return new AIError(
          AIErrorType.RATE_LIMIT_ERROR,
          `OpenAI rate limit exceeded: ${error.message}`,
          this.type,
          error
        );
      }

      // Authentication error
      if (error.status === 401) {
        return new AIError(
          AIErrorType.AUTHENTICATION_ERROR,
          `OpenAI authentication failed: ${error.message}`,
          this.type,
          error
        );
      }

      // Context length error
      if (error.status === 400 && error.message.includes('maximum context length')) {
        return new AIError(
          AIErrorType.CONTEXT_LENGTH_ERROR,
          `OpenAI context length exceeded: ${error.message}`,
          this.type,
          error
        );
      }

      // Generic API error
      return new AIError(
        AIErrorType.API_ERROR,
        `OpenAI API error: ${error.message}`,
        this.type,
        error
      );
    }

    // Use base error handling for other errors
    return this.handleError(error);
  }

  /**
   * More accurate token counting using OpenAI's estimation
   */
  countTokens(text: string): number {
    // Approximate GPT tokenization
    // For production, consider using tiktoken library
    const words = text.split(/\s+/).length;
    const chars = text.length;

    // GPT models: roughly 1 token per 4 characters or 0.75 tokens per word
    return Math.ceil(Math.max(chars / 4, words * 0.75));
  }
}
