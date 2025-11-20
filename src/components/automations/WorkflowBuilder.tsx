/**
 * =============================================================================
 * WORKFLOW BUILDER - Visual No-Code Automation Builder
 * =============================================================================
 * Drag-and-drop workflow builder with triggers, conditions, and actions
 * =============================================================================
 */

'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  MessageSquare,
  Tag,
  Clock,
  GitBranch,
  Send,
  Bot,
  Webhook,
  UserPlus,
  CheckCircle,
} from 'lucide-react';
import { AutomationTriggerType, AutomationActionType } from '@/types/automation';

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};

function TriggerNode({ data }: { data: any }) {
  const icons: Record<string, any> = {
    [AutomationTriggerType.MESSAGE_RECEIVED]: MessageSquare,
    [AutomationTriggerType.KEYWORD_MATCH]: MessageSquare,
    [AutomationTriggerType.SCHEDULE]: Clock,
    [AutomationTriggerType.CONTACT_ADDED]: UserPlus,
  };

  const Icon = icons[data.type] || MessageSquare;

  return (
    <Card className="min-w-[200px] border-2 border-primary p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Trigger</p>
          <p className="font-medium">{data.label}</p>
        </div>
      </div>
    </Card>
  );
}

function ConditionNode({ data }: { data: any }) {
  return (
    <Card className="min-w-[200px] border-2 border-yellow-500 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10">
          <GitBranch className="h-4 w-4 text-yellow-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Condition</p>
          <p className="font-medium">{data.label}</p>
        </div>
      </div>
    </Card>
  );
}

function ActionNode({ data }: { data: any }) {
  const icons: Record<string, any> = {
    [AutomationActionType.SEND_MESSAGE]: Send,
    [AutomationActionType.CALL_AI]: Bot,
    [AutomationActionType.TAG_CONTACT]: Tag,
    [AutomationActionType.ASSIGN_TO_USER]: UserPlus,
    [AutomationActionType.SEND_WEBHOOK]: Webhook,
    [AutomationActionType.MARK_AS_RESOLVED]: CheckCircle,
  };

  const Icon = icons[data.type] || Send;

  return (
    <Card className="min-w-[200px] border-2 border-blue-500 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Action</p>
          <p className="font-medium">{data.label}</p>
        </div>
      </div>
    </Card>
  );
}

interface WorkflowBuilderProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onChange?: (nodes: Node[], edges: Edge[]) => void;
}

export function WorkflowBuilder({
  initialNodes = [],
  initialEdges = [],
  onChange
}: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<'trigger' | 'condition' | 'action'>('action');

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      onChange?.(nodes, newEdges);
    },
    [edges, nodes, onChange, setEdges]
  );

  const addNode = (type: 'trigger' | 'condition' | 'action', nodeData: any) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: nodeData,
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    onChange?.(newNodes, edges);
  };

  return (
    <div className="flex h-[600px] gap-4">
      {/* Node Palette */}
      <Card className="w-64 p-4">
        <h3 className="mb-4 font-semibold">Add Nodes</h3>

        <div className="space-y-4">
          {/* Triggers */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">TRIGGERS</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('trigger', {
                  type: AutomationTriggerType.MESSAGE_RECEIVED,
                  label: 'Message Received'
                })}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Received
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('trigger', {
                  type: AutomationTriggerType.KEYWORD_MATCH,
                  label: 'Keyword Match'
                })}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Keyword Match
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('trigger', {
                  type: AutomationTriggerType.SCHEDULE,
                  label: 'Schedule'
                })}
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">CONDITIONS</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('condition', {
                  label: 'Keyword Contains'
                })}
              >
                <GitBranch className="mr-2 h-4 w-4" />
                Keyword Contains
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('condition', {
                  label: 'Has Tag'
                })}
              >
                <Tag className="mr-2 h-4 w-4" />
                Has Tag
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">ACTIONS</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('action', {
                  type: AutomationActionType.SEND_MESSAGE,
                  label: 'Send Message'
                })}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('action', {
                  type: AutomationActionType.CALL_AI,
                  label: 'Call AI'
                })}
              >
                <Bot className="mr-2 h-4 w-4" />
                Call AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('action', {
                  type: AutomationActionType.TAG_CONTACT,
                  label: 'Tag Contact'
                })}
              >
                <Tag className="mr-2 h-4 w-4" />
                Tag Contact
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('action', {
                  type: AutomationActionType.ASSIGN_TO_USER,
                  label: 'Assign to User'
                })}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign to User
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Canvas */}
      <Card className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </Card>
    </div>
  );
}
