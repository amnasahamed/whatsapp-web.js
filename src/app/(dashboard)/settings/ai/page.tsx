/**
 * =============================================================================
 * AI SETTINGS - AI Configuration Page
 * =============================================================================
 * Configure AI providers, models, and behavior
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bot, Check } from 'lucide-react';

const aiProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 Turbo',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 Opus, Sonnet, Haiku',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro, Ultra',
    models: ['gemini-pro', 'gemini-ultra'],
  },
  {
    id: 'custom',
    name: 'Custom LLM',
    description: 'Ollama, LM Studio, vLLM',
    models: ['custom'],
  },
];

export default function AISettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  const currentProvider = aiProviders.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
          <CardDescription>
            Select your preferred AI provider for automated responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {aiProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`relative flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                  selectedProvider === provider.id ? 'border-primary bg-accent' : ''
                }`}
              >
                {selectedProvider === provider.id && (
                  <div className="absolute right-4 top-4">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Selection</CardTitle>
          <CardDescription>
            Choose the specific model for {currentProvider?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentProvider?.models.map((model) => (
              <button
                key={model}
                onClick={() => setSelectedModel(model)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  selectedModel === model ? 'border-primary bg-accent' : ''
                }`}
              >
                <span className="font-medium">{model}</span>
                {selectedModel === model && <Check className="h-5 w-5 text-primary" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure API keys for {currentProvider?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input type="password" placeholder="sk-..." />
          </div>
          {selectedProvider === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Endpoint URL</label>
              <Input placeholder="http://localhost:11434/api/generate" />
            </div>
          )}
          <Button>Save Configuration</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Behavior</CardTitle>
          <CardDescription>Configure how AI responds to messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">System Prompt</label>
            <textarea
              className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="You are a helpful customer service assistant..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature</label>
            <Input type="number" min="0" max="2" step="0.1" defaultValue="0.7" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Tokens</label>
            <Input type="number" defaultValue="500" />
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
