/**
 * =============================================================================
 * ANTHROPIC PROVIDER - Claude AI Implementation
 * =============================================================================
 * Production-ready Anthropic Claude integration with comprehensive error
 * handling and performance optimization.
 * =============================================================================
 */

import Anthropic from '@anthropic-ai/sdk';
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
 * Anthropic Claude Provider Implementation
 * Supports Claude 3 family (Opus, Sonnet, Haiku)
 */
export class AnthropicProvider extends BaseAIProvider {
  private client?: Anthropic;

  constructor() {
    super('Anthropic', AIProviderType.ANTHROPIC);
  }

  /**
   * Provider capabilities
   */
  get capabilities(): AIProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsFunctionCalling: false, // Claude 3 doesn't have native function calling yet
      supportsVision: true, // Claude 3 supports vision
      maxContextLength: 200000, // Claude 3 has 200k context window
      supportedModels: [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2.0',
        'claude-instant-1.2',
      ],
    };
  }

  /**
   * Initialize Anthropic client
   */
  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeout || 60000,
      maxRetries: 2,
    });
  }

  /**
   * Validate Anthropic-specific configuration
   */
  protected async validateProviderConfig(config: AIProviderConfig): Promise<boolean> {
    // Check if API key format is valid (starts with sk-ant-)
    if (!config.apiKey.startsWith('sk-ant-')) {
      return false;
    }

    // Validate model is supported
    if (!this.capabilities.supportedModels.includes(config.model)) {
      console.warn(`Model ${config.model} may not be supported. Proceeding anyway.`);
    }

    return true;
  }

  /**
   * Generate completion using Anthropic API
   */
  protected async generateCompletion(
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    if (!this.client) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'Anthropic client not initialized',
        this.type
      );
    }

    const params = this.mergeConfig(request);

    try {
      // Extract system prompt - Anthropic handles it separately
      let systemPrompt = request.systemPrompt || '';

      // Filter out system messages and build conversation
      const conversationMessages = request.messages
        .filter((msg) => msg.role !== AIMessageRole.SYSTEM)
        .map((msg) => ({
          role: this.mapRoleToAnthropic(msg.role),
          content: this.sanitizeText(msg.content),
        }));

      // If there are system messages in the conversation, merge them into system prompt
      const systemMessages = request.messages.filter(
        (msg) => msg.role === AIMessageRole.SYSTEM
      );
      if (systemMessages.length > 0) {
        systemPrompt = [systemPrompt, ...systemMessages.map((m) => m.content)]
          .filter(Boolean)
          .join('\n\n');
      }

      const response = await this.client.messages.create({
        model: this.config!.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
        system: systemPrompt || undefined,
        messages: conversationMessages as Anthropic.MessageParam[],
        stop_sequences: request.stopSequences,
      });

      // Extract text content from response
      const textContent = response.content.find((block) => block.type === 'text');
      const content = textContent && 'text' in textContent ? textContent.text : '';

      return {
        content,
        finishReason: this.mapStopReason(response.stop_reason),
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        provider: this.type,
        latencyMs: 0, // Will be set by base class
        metadata: {
          id: response.id,
          stopSequence: response.stop_sequence,
        },
      };
    } catch (error) {
      throw this.handleAnthropicError(error);
    }
  }

  /**
   * Stream completion
   */
  async *streamComplete(
    request: AICompletionRequest
  ): AsyncGenerator<string, AICompletionResponse, undefined> {
    if (!this.client) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'Anthropic client not initialized',
        this.type
      );
    }

    const params = this.mergeConfig(request);
    let systemPrompt = request.systemPrompt || '';

    const conversationMessages = request.messages
      .filter((msg) => msg.role !== AIMessageRole.SYSTEM)
      .map((msg) => ({
        role: this.mapRoleToAnthropic(msg.role),
        content: this.sanitizeText(msg.content),
      }));

    const systemMessages = request.messages.filter(
      (msg) => msg.role === AIMessageRole.SYSTEM
    );
    if (systemMessages.length > 0) {
      systemPrompt = [systemPrompt, ...systemMessages.map((m) => m.content)]
        .filter(Boolean)
        .join('\n\n');
    }

    const stream = await this.client.messages.stream({
      model: this.config!.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      system: systemPrompt || undefined,
      messages: conversationMessages as Anthropic.MessageParam[],
    });

    let fullContent = '';
    let finalMessage: Anthropic.Message | null = null;

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if ('text' in event.delta) {
          const delta = event.delta.text;
          fullContent += delta;
          yield delta;
        }
      } else if (event.type === 'message_stop') {
        finalMessage = await stream.finalMessage();
      }
    }

    if (!finalMessage) {
      throw new AIError(
        AIErrorType.API_ERROR,
        'No final message received from Anthropic stream',
        this.type
      );
    }

    return {
      content: fullContent,
      finishReason: this.mapStopReason(finalMessage.stop_reason),
      usage: {
        promptTokens: finalMessage.usage.input_tokens,
        completionTokens: finalMessage.usage.output_tokens,
        totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      },
      model: finalMessage.model,
      provider: this.type,
      latencyMs: 0,
    };
  }

  /**
   * Map our role enum to Anthropic role
   */
  private mapRoleToAnthropic(role: AIMessageRole): 'user' | 'assistant' {
    // Anthropic only supports user and assistant roles
    // System messages are handled separately via the system parameter
    if (role === AIMessageRole.ASSISTANT) {
      return 'assistant';
    }
    return 'user';
  }

  /**
   * Map Anthropic stop reason to our format
   */
  private mapStopReason(
    reason: string | null
  ): AICompletionResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  /**
   * Enhanced error handling for Anthropic-specific errors
   */
  private handleAnthropicError(error: unknown): AIError {
    if (error instanceof Anthropic.APIError) {
      // Rate limit error
      if (error.status === 429) {
        return new AIError(
          AIErrorType.RATE_LIMIT_ERROR,
          `Anthropic rate limit exceeded: ${error.message}`,
          this.type,
          error
        );
      }

      // Authentication error
      if (error.status === 401) {
        return new AIError(
          AIErrorType.AUTHENTICATION_ERROR,
          `Anthropic authentication failed: ${error.message}`,
          this.type,
          error
        );
      }

      // Context length error
      if (error.status === 400 && error.message.includes('prompt is too long')) {
        return new AIError(
          AIErrorType.CONTEXT_LENGTH_ERROR,
          `Anthropic context length exceeded: ${error.message}`,
          this.type,
          error
        );
      }

      // Generic API error
      return new AIError(
        AIErrorType.API_ERROR,
        `Anthropic API error: ${error.message}`,
        this.type,
        error
      );
    }

    // Use base error handling for other errors
    return this.handleError(error);
  }

  /**
   * Token counting for Claude
   */
  countTokens(text: string): number {
    // Claude's tokenization is similar to GPT
    // For production, consider using Anthropic's token counting endpoint
    const words = text.split(/\s+/).length;
    const chars = text.length;

    // Approximate: 1 token per 4 characters
    return Math.ceil(Math.max(chars / 4, words * 0.75));
  }
}
