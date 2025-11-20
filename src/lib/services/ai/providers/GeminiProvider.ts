/**
 * =============================================================================
 * GEMINI PROVIDER - Google Gemini AI Implementation
 * =============================================================================
 * Production-ready Google Gemini integration with comprehensive error
 * handling and performance optimization.
 * =============================================================================
 */

import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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
 * Google Gemini Provider Implementation
 * Supports Gemini Pro and Gemini Pro Vision
 */
export class GeminiProvider extends BaseAIProvider {
  private client?: GoogleGenerativeAI;
  private model?: GenerativeModel;

  constructor() {
    super('Gemini', AIProviderType.GEMINI);
  }

  /**
   * Provider capabilities
   */
  get capabilities(): AIProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      maxContextLength: 32768, // Gemini Pro context window
      supportedModels: [
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
      ],
    };
  }

  /**
   * Initialize Gemini client
   */
  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({
      model: config.model,
      generationConfig: {
        maxOutputTokens: config.maxTokens || 2048,
        temperature: config.temperature || 0.7,
        topP: config.topP || 0.95,
      },
      // Safety settings - adjust based on your needs
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  /**
   * Validate Gemini-specific configuration
   */
  protected async validateProviderConfig(config: AIProviderConfig): Promise<boolean> {
    // Check if API key format is valid (starts with AIza)
    if (!config.apiKey.startsWith('AIza')) {
      return false;
    }

    // Validate model is supported
    if (!this.capabilities.supportedModels.includes(config.model)) {
      console.warn(`Model ${config.model} may not be supported. Proceeding anyway.`);
    }

    return true;
  }

  /**
   * Generate completion using Gemini API
   */
  protected async generateCompletion(
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    if (!this.model) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'Gemini model not initialized',
        this.type
      );
    }

    try {
      // Build prompt with system message and conversation history
      const prompt = this.buildGeminiPrompt(request);

      const result = await this.model.generateContent(prompt);
      const response = result.response;

      // Check if content was blocked
      if (response.promptFeedback?.blockReason) {
        throw new AIError(
          AIErrorType.INVALID_REQUEST,
          `Content blocked: ${response.promptFeedback.blockReason}`,
          this.type
        );
      }

      const text = response.text();

      // Estimate token usage (Gemini doesn't provide exact counts yet)
      const promptTokens = this.countTokens(prompt);
      const completionTokens = this.countTokens(text);

      return {
        content: text,
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        model: this.config!.model,
        provider: this.type,
        latencyMs: 0, // Will be set by base class
        metadata: {
          safetyRatings: response.candidates?.[0]?.safetyRatings,
        },
      };
    } catch (error) {
      throw this.handleGeminiError(error);
    }
  }

  /**
   * Stream completion
   */
  async *streamComplete(
    request: AICompletionRequest
  ): AsyncGenerator<string, AICompletionResponse, undefined> {
    if (!this.model) {
      throw new AIError(
        AIErrorType.INVALID_REQUEST,
        'Gemini model not initialized',
        this.type
      );
    }

    const prompt = this.buildGeminiPrompt(request);
    const result = await this.model.generateContentStream(prompt);

    let fullContent = '';
    let finishReason: AICompletionResponse['finishReason'] = 'stop';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullContent += chunkText;
      yield chunkText;

      if (chunk.candidates?.[0]?.finishReason) {
        finishReason = this.mapFinishReason(chunk.candidates[0].finishReason);
      }
    }

    const promptTokens = this.countTokens(prompt);
    const completionTokens = this.countTokens(fullContent);

    return {
      content: fullContent,
      finishReason,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      model: this.config!.model,
      provider: this.type,
      latencyMs: 0,
    };
  }

  /**
   * Build Gemini-compatible prompt from our message format
   */
  private buildGeminiPrompt(request: AICompletionRequest): string {
    const parts: string[] = [];

    // Add system prompt if provided
    if (request.systemPrompt) {
      parts.push(`System: ${this.sanitizeText(request.systemPrompt)}`);
    }

    // Add conversation messages
    for (const msg of request.messages) {
      const role = this.mapRoleLabel(msg.role);
      parts.push(`${role}: ${this.sanitizeText(msg.content)}`);
    }

    // Add a prompt for the assistant to respond
    parts.push('Assistant:');

    return parts.join('\n\n');
  }

  /**
   * Map our role to display label
   */
  private mapRoleLabel(role: AIMessageRole): string {
    switch (role) {
      case AIMessageRole.SYSTEM:
        return 'System';
      case AIMessageRole.USER:
        return 'User';
      case AIMessageRole.ASSISTANT:
        return 'Assistant';
      case AIMessageRole.FUNCTION:
        return 'Function';
      default:
        return 'User';
    }
  }

  /**
   * Map Gemini finish reason to our format
   */
  private mapFinishReason(
    reason: string | undefined
  ): AICompletionResponse['finishReason'] {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      case 'RECITATION':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Enhanced error handling for Gemini-specific errors
   */
  private handleGeminiError(error: unknown): AIError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Rate limit error (429)
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      return new AIError(
        AIErrorType.RATE_LIMIT_ERROR,
        `Gemini rate limit exceeded: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Authentication error (401, 403)
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('API key')
    ) {
      return new AIError(
        AIErrorType.AUTHENTICATION_ERROR,
        `Gemini authentication failed: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Context length error
    if (errorMessage.includes('context length') || errorMessage.includes('too long')) {
      return new AIError(
        AIErrorType.CONTEXT_LENGTH_ERROR,
        `Gemini context length exceeded: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Content blocked
    if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY')) {
      return new AIError(
        AIErrorType.INVALID_REQUEST,
        `Content blocked by Gemini safety filters: ${errorMessage}`,
        this.type,
        error
      );
    }

    // Use base error handling for other errors
    return this.handleError(error);
  }

  /**
   * Token counting for Gemini
   */
  countTokens(text: string): number {
    // Gemini's tokenization
    // For production, consider using Gemini's countTokens endpoint
    const words = text.split(/\s+/).length;
    const chars = text.length;

    // Approximate: similar to GPT
    return Math.ceil(Math.max(chars / 4, words * 0.75));
  }
}
