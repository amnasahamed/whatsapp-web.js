/**
 * =============================================================================
 * CONTACTS PAGE - Contact Management Interface
 * =============================================================================
 * View and manage all contacts with filtering and search
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
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
import { Search, UserPlus, Download, Filter } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils/helpers';

// Mock data
const mockContacts = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+12345678900',
    email: 'john@example.com',
    tags: ['customer', 'vip'],
    lastMessageAt: new Date(),
    messageCount: 45,
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+12345678901',
    email: 'jane@example.com',
    tags: ['lead'],
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    messageCount: 12,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    phone: '+12345678902',
    email: 'mike@example.com',
    tags: ['customer'],
    lastMessageAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    messageCount: 28,
  },
  {
    id: '4',
    name: 'Sarah Williams',
    phone: '+12345678903',
    email: 'sarah@example.com',
    tags: ['lead', 'hot'],
    lastMessageAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    messageCount: 8,
  },
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = mockContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp contacts and customer information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockContacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContacts.filter((c) => c.tags.includes('customer')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContacts.filter((c) => c.tags.includes('lead')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContacts.filter((c) => c.tags.includes('vip')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Contacts</CardTitle>
              <CardDescription>A list of all your contacts</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Contacts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium">Contact</th>
                  <th className="pb-3 text-left text-sm font-medium">Phone</th>
                  <th className="pb-3 text-left text-sm font-medium">Email</th>
                  <th className="pb-3 text-left text-sm font-medium">Tags</th>
                  <th className="pb-3 text-left text-sm font-medium">Messages</th>
                  <th className="pb-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={contact.name} />
                        <div>
                          <p className="font-medium">{contact.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm">{formatPhoneNumber(contact.phone)}</td>
                    <td className="py-4 text-sm">{contact.email}</td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-sm">{contact.messageCount}</td>
                    <td className="py-4">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
