/**
 * =============================================================================
 * NEW AUTOMATION PAGE - Create Automation
 * =============================================================================
 * Workflow builder for creating new automations
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WorkflowBuilder } from '@/components/automations/WorkflowBuilder';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewAutomationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const handleSave = () => {
    // TODO: Save automation via tRPC
    console.log('Saving automation:', { name, description, nodes, edges });
    router.push('/automations');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/automations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Automation</h1>
            <p className="text-muted-foreground">
              Build a no-code automation workflow
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Automation
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Give your automation a name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g., Welcome New Customers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Describe what this automation does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workflow Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Design</CardTitle>
          <CardDescription>
            Drag nodes from the left panel and connect them to build your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowBuilder
            initialNodes={nodes}
            initialEdges={edges}
            onChange={(newNodes, newEdges) => {
              setNodes(newNodes as any);
              setEdges(newEdges as any);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
