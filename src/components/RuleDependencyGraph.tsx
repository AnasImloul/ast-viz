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
import { AlertCircle, Circle, Target } from 'lucide-react';

interface RuleDependencyGraphProps {
  grammarText: string;
  onRuleClick?: (ruleName: string) => void;
}

// Custom node component
const RuleNode: React.FC<{
  data: {
    label: string;
    metadata: RuleMetadata;
    onClick?: () => void;
  };
}> = ({ data }) => {
  const { label, metadata, onClick } = data;

  const getNodeColor = () => {
    if (metadata.isEntry) return 'from-green-400 to-green-600';
    if (metadata.isTerminal) return 'from-blue-400 to-blue-600';
    return 'from-purple-400 to-purple-600';
  };

  const getIcon = () => {
    if (metadata.isEntry) return Target;
    if (metadata.isTerminal) return Circle;
    return Circle;
  };

  const Icon = getIcon();

  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 rounded-lg border-2 shadow-lg cursor-pointer
        bg-gradient-to-br ${getNodeColor()}
        text-white font-mono text-sm
        transition-all hover:shadow-xl hover:scale-105
        min-w-[120px]
        relative
      `}
    >
      {/* Target handle (top) - where edges come IN */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#fff',
          width: 10,
          height: 10,
          border: '2px solid #8b5cf6',
        }}
      />
      
      <div className="flex items-center gap-2 justify-between">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="font-bold">{label}</span>
      </div>
      <div className="mt-2 text-xs opacity-90 space-y-0.5">
        <div>Used: {metadata.usageCount}×</div>
        {metadata.complexity > 0 && (
          <div>Complexity: {metadata.complexity}</div>
        )}
      </div>
      
      {/* Source handle (bottom) - where edges go OUT */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#fff',
          width: 10,
          height: 10,
          border: '2px solid #8b5cf6',
        }}
      />
    </div>
  );
};

const nodeTypes = {
  ruleNode: RuleNode,
};

// Ensure edges render
const edgeTypes = {};

const RuleDependencyGraphInner: React.FC<RuleDependencyGraphProps> = ({
  grammarText,
  onRuleClick,
}) => {
  const analysis = useMemo<GrammarAnalysis>(() => {
    return analyzeGrammar(grammarText);
  }, [grammarText]);

  // Calculate layout using Dagre for optimal graph layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (analysis.rules.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const processed = new Set<string>();

    // Create Dagre graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
      rankdir: 'TB', // Top to Bottom
      nodesep: 100,  // Horizontal spacing between nodes
      ranksep: 150,  // Vertical spacing between ranks
      marginx: 50,
      marginy: 50,
    });

    // Add nodes to Dagre graph (without positions)
    analysis.rules.forEach(rule => {
      const meta = analysis.metadata.get(rule);
      if (!meta) return;

      // Node dimensions (approximate based on content)
      const width = 120;
      const height = 80;

      dagreGraph.setNode(rule, { width, height });
      processed.add(rule);
    });

    // Add edges to Dagre graph
    analysis.dependencies.forEach(dep => {
      if (processed.has(dep.from) && processed.has(dep.to)) {
        dagreGraph.setEdge(dep.from, dep.to);
      }
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Create ReactFlow nodes with Dagre positions
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

    // Create edges
    analysis.dependencies.forEach(dep => {
      if (processed.has(dep.from) && processed.has(dep.to)) {
        const edge: Edge = {
          id: `${dep.from}-to-${dep.to}`,
          source: dep.from,
          target: dep.to,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#8b5cf6',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#8b5cf6',
          },
        };
        edges.push(edge);
      }
    });

    return { nodes, edges };
  }, [analysis, onRuleClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes and edges when they change
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
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
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
          animated: true,
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
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border-2 rounded-lg p-3 shadow-lg text-xs space-y-2 z-10">
        <div className="font-semibold mb-2">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-green-600" />
          <span>Entry Rule</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-400 to-purple-600" />
          <span>Intermediate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-600" />
          <span>Terminal</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t">
          <div className="w-8 h-0.5 bg-purple-500" />
          <span>Rule Reference</span>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm border-2 rounded-lg p-3 shadow-lg text-xs space-y-1 z-10">
        <div className="font-semibold mb-1">Grammar Stats</div>
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

