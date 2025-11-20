/**
 * =============================================================================
 * ANALYTICS PAGE - Analytics Dashboard
 * =============================================================================
 * Comprehensive analytics dashboard with charts and metrics
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { TimeRange } from '@/types/analytics';

// Mock data
const messageVolumeData = [
  { date: 'Mon', inbound: 245, outbound: 198 },
  { date: 'Tue', inbound: 312, outbound: 276 },
  { date: 'Wed', inbound: 289, outbound: 234 },
  { date: 'Thu', inbound: 401, outbound: 367 },
  { date: 'Fri', inbound: 456, outbound: 423 },
  { date: 'Sat', inbound: 187, outbound: 156 },
  { date: 'Sun', inbound: 145, outbound: 123 },
];

const messageTypeData = [
  { name: 'Text', value: 1247, color: '#3b82f6' },
  { name: 'Image', value: 342, color: '#10b981' },
  { name: 'Video', value: 89, color: '#f59e0b' },
  { name: 'Document', value: 156, color: '#ef4444' },
  { name: 'Audio', value: 67, color: '#8b5cf6' },
];

const responseTimeData = [
  { range: '0-1min', count: 342 },
  { range: '1-5min', count: 567 },
  { range: '5-15min', count: 234 },
  { range: '15-30min', count: 123 },
  { range: '30min+', count: 89 },
];

const userPerformanceData = [
  { name: 'John Doe', messages: 342, conversations: 87, avgResponse: 2.3 },
  { name: 'Jane Smith', messages: 298, conversations: 76, avgResponse: 3.1 },
  { name: 'Mike Johnson', messages: 234, conversations: 65, avgResponse: 4.2 },
  { name: 'Sarah Williams', messages: 189, conversations: 52, avgResponse: 3.8 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.LAST_7_DAYS);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value={TimeRange.TODAY}>Today</option>
            <option value={TimeRange.YESTERDAY}>Yesterday</option>
            <option value={TimeRange.LAST_7_DAYS}>Last 7 Days</option>
            <option value={TimeRange.LAST_30_DAYS}>Last 30 Days</option>
            <option value={TimeRange.THIS_MONTH}>This Month</option>
          </select>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,547</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">287</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8.2% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2 min</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              -15.3% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.4%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +2.1% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Message Volume</CardTitle>
          <CardDescription>Inbound and outbound messages over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="inbound"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Inbound"
              />
              <Line
                type="monotone"
                dataKey="outbound"
                stroke="#10b981"
                strokeWidth={2}
                name="Outbound"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Message Types */}
        <Card>
          <CardHeader>
            <CardTitle>Messages by Type</CardTitle>
            <CardDescription>Distribution of message types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={messageTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {messageTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
            <CardDescription>How quickly messages are answered</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Individual user statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium">User</th>
                  <th className="pb-3 text-left text-sm font-medium">Messages</th>
                  <th className="pb-3 text-left text-sm font-medium">Conversations</th>
                  <th className="pb-3 text-left text-sm font-medium">Avg Response Time</th>
                  <th className="pb-3 text-left text-sm font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {userPerformanceData.map((user, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-4 font-medium">{user.name}</td>
                    <td className="py-4">{user.messages}</td>
                    <td className="py-4">{user.conversations}</td>
                    <td className="py-4">{user.avgResponse} min</td>
                    <td className="py-4">
                      <Badge variant={user.avgResponse < 3 ? 'default' : 'secondary'}>
                        {user.avgResponse < 3 ? 'Excellent' : 'Good'}
                      </Badge>
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
