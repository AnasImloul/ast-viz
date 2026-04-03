import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  ReactFlowProvider,
  Handle,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { analyzeGrammar, type GrammarAnalysis, type RuleMetadata } from '@/lib/grammarAnalysis';

interface RuleDependencyGraphProps {
  grammarText: string;
  onRuleClick?: (ruleName: string) => void;
}

const RuleNode: React.FC<{
  data: {
    label: string;
    metadata: RuleMetadata;
    onClick?: () => void;
  };
}> = ({ data }) => {
  const { label, metadata, onClick } = data;

  const getBgColor = () => {
    if (metadata.isEntry) return 'bg-green-600';
    if (metadata.isTerminal) return 'bg-blue-600';
    return 'bg-purple-600';
  };

  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 rounded-lg border shadow-sm cursor-pointer
        ${getBgColor()}
        text-white font-mono text-sm
        transition-colors hover:opacity-90
        min-w-[120px]
        relative
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#fff',
          width: 8,
          height: 8,
          border: '2px solid #6b7280',
        }}
      />
      
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{label}</span>
      </div>
      <div className="mt-1.5 text-xs opacity-80 space-y-0.5">
        <div>Used: {metadata.usageCount}x</div>
        {metadata.complexity > 0 && (
          <div>Complexity: {metadata.complexity}</div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#fff',
          width: 8,
          height: 8,
          border: '2px solid #6b7280',
        }}
      />
    </div>
  );
};

const nodeTypes = {
  ruleNode: RuleNode,
};

const edgeTypes = {};

const RuleDependencyGraphInner: React.FC<RuleDependencyGraphProps> = ({
  grammarText,
  onRuleClick,
}) => {
  const analysis = useMemo<GrammarAnalysis>(() => {
    return analyzeGrammar(grammarText);
  }, [grammarText]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (analysis.rules.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const processed = new Set<string>();

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
      rankdir: 'TB',
      nodesep: 100,
      ranksep: 150,
      marginx: 50,
      marginy: 50,
    });

    analysis.rules.forEach(rule => {
      const meta = analysis.metadata.get(rule);
      if (!meta) return;
      dagreGraph.setNode(rule, { width: 120, height: 80 });
      processed.add(rule);
    });

    analysis.dependencies.forEach(dep => {
      if (processed.has(dep.from) && processed.has(dep.to)) {
        dagreGraph.setEdge(dep.from, dep.to);
      }
    });

    dagre.layout(dagreGraph);

    analysis.rules.forEach(rule => {
      const meta = analysis.metadata.get(rule);
      if (!meta) return;

      const nodeWithPosition = dagreGraph.node(rule);

      nodes.push({
        id: rule,
        type: 'ruleNode',
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
        data: {
          label: rule,
          metadata: meta,
          onClick: () => onRuleClick?.(rule),
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    analysis.dependencies.forEach(dep => {
      if (processed.has(dep.from) && processed.has(dep.to)) {
        const edge: Edge = {
          id: `${dep.from}-to-${dep.to}`,
          source: dep.from,
          target: dep.to,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#6b7280',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#6b7280',
          },
        };
        edges.push(edge);
      }
    });

    return { nodes, edges };
  }, [analysis, onRuleClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onRuleClick?.(node.id);
    },
    [onRuleClick]
  );

  if (analysis.rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-sm text-muted-foreground">
          No rules defined yet. Create some rules to see their dependencies.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        edgesUpdatable={false}
        edgesFocusable={true}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnScroll={false}
        preventScrolling={true}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 border rounded-lg p-3 text-xs space-y-1.5 z-10">
        <div className="font-medium mb-1.5">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600" />
          <span>Entry Rule</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-600" />
          <span>Intermediate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-600" />
          <span>Terminal</span>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-background/95 border rounded-lg p-3 text-xs space-y-1 z-10">
        <div className="font-medium mb-1">Stats</div>
        <div>Rules: {analysis.rules.length}</div>
        <div>Dependencies: {analysis.dependencies.length}</div>
        {analysis.unusedRules.length > 0 && (
          <div className="text-orange-600 dark:text-orange-400">
            Unused: {analysis.unusedRules.length}
          </div>
        )}
        {analysis.hasLeftRecursion && (
          <div className="text-blue-600 dark:text-blue-400">
            Left Recursion: Yes
          </div>
        )}
      </div>
    </div>
  );
};

export const RuleDependencyGraph: React.FC<RuleDependencyGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <RuleDependencyGraphInner {...props} />
    </ReactFlowProvider>
  );
};
