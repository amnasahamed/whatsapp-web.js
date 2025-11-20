/**
 * =============================================================================
 * INBOX PAGE - WhatsApp-Style Chat Interface
 * =============================================================================
 * Main inbox with conversations list and message view
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime } from '@/lib/utils/helpers';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Search,
} from 'lucide-react';

// Mock data - replace with real data from tRPC
const mockConversations = [
  {
    id: '1',
    contactName: 'John Doe',
    lastMessage: 'Hey, I have a question about your product...',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    unreadCount: 3,
    isOnline: true,
  },
  {
    id: '2',
    contactName: 'Jane Smith',
    lastMessage: 'Thanks for the quick response!',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '3',
    contactName: 'Mike Johnson',
    lastMessage: 'Can we schedule a call?',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: '4',
    contactName: 'Sarah Williams',
    lastMessage: 'Perfect! See you then.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
  },
];

const mockMessages = [
  {
    id: '1',
    content: 'Hey, I have a question about your product.',
    direction: 'INBOUND',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    status: 'READ',
  },
  {
    id: '2',
    content: "Hi! I'd be happy to help. What would you like to know?",
    direction: 'OUTBOUND',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    status: 'READ',
  },
  {
    id: '3',
    content: 'I wanted to know about the pricing and if there are any discounts available for startups.',
    direction: 'INBOUND',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'READ',
  },
  {
    id: '4',
    content: 'Great question! We do have special pricing for startups. Let me share the details with you.',
    direction: 'OUTBOUND',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    status: 'DELIVERED',
  },
];

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');

  const selectedConversation = mockConversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // TODO: Implement sending message via tRPC
    console.log('Sending message:', messageInput);
    setMessageInput('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-lg border bg-background">
      {/* Conversations List */}
      <div className="flex w-80 flex-col border-r">
        {/* Search */}
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {mockConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversationId(conversation.id)}
              className={cn(
                'flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-accent',
                selectedConversationId === conversation.id && 'bg-accent'
              )}
            >
              <div className="relative">
                <Avatar
                  fallback={conversation.contactName}
                  className="h-12 w-12"
                />
                {conversation.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{conversation.contactName}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(conversation.timestamp)}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <Badge variant="default" className="ml-2 h-5 w-5 justify-center rounded-full p-0">
                  {conversation.unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Avatar
              fallback={selectedConversation?.contactName}
              className="h-10 w-10"
            />
            <div>
              <p className="font-semibold">{selectedConversation?.contactName}</p>
              <p className="text-xs text-muted-foreground">
                {selectedConversation?.isOnline ? (
                  <span className="text-green-600">Online</span>
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-background flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-lg px-4 py-2',
                    message.direction === 'OUTBOUND'
                      ? 'message-sent'
                      : 'message-received'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] opacity-70">
                      {formatRelativeTime(message.timestamp)}
                    </span>
                    {message.direction === 'OUTBOUND' && (
                      <span className="text-[10px] opacity-70">
                        {message.status === 'READ' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="icon">
              <Smile className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
