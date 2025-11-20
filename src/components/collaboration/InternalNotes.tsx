/**
 * =============================================================================
 * INTERNAL NOTES - Team Collaboration Notes Component
 * =============================================================================
 * Internal notes for team collaboration on conversations
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { Send, AtSign, Paperclip } from 'lucide-react';

interface Note {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  mentions: string[];
  createdAt: Date;
}

interface InternalNotesProps {
  conversationId: string;
  notes?: Note[];
  onAddNote?: (content: string, mentions: string[]) => void;
}

export function InternalNotes({ conversationId, notes = [], onAddNote }: InternalNotesProps) {
  const [noteContent, setNoteContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  const handleSubmit = () => {
    if (!noteContent.trim()) return;

    // Extract mentions from content (@username)
    const mentions = noteContent.match(/@(\w+)/g)?.map((m) => m.substring(1)) || [];

    onAddNote?.(noteContent, mentions);
    setNoteContent('');
  };

  // Mock notes if none provided
  const displayNotes: Note[] = notes.length > 0 ? notes : [
    {
      id: '1',
      author: { name: 'Jane Smith' },
      content: 'Customer is interested in the premium plan. Follow up tomorrow.',
      mentions: [],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      author: { name: 'Mike Johnson' },
      content: '@john Can you help with pricing questions for this customer?',
      mentions: ['john'],
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Internal Notes</h3>
        <p className="text-xs text-muted-foreground">
          Notes are only visible to your team
        </p>
      </div>

      {/* Notes List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {displayNotes.map((note) => (
          <div key={note.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <Avatar fallback={note.author.name} className="h-8 w-8" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{note.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(note.createdAt)}
                  </span>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  {note.content}
                </div>
                {note.mentions.length > 0 && (
                  <div className="flex gap-1">
                    {note.mentions.map((mention, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        @{mention}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Note Input */}
      <div className="border-t p-4">
        <div className="space-y-2">
          <textarea
            placeholder="Add a note... Use @ to mention team members"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === '@') setShowMentions(true);
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="min-h-[80px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMentions(!showMentions)}
              >
                <AtSign className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cmd/Ctrl + Enter to submit
          </p>
        </div>
      </div>
    </div>
  );
}
