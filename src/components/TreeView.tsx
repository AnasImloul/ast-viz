import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { TreeNode } from '@/types/ast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Shrink, X } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

cytoscape.use(dagre);

interface TreeViewProps {
  data: TreeNode | null;
  optimizeEnabled: boolean;
  fullNodeCount: number;
  optimizedNodeCount: number;
  onToggleOptimize: () => void;
  onNodeClick?: (interval: { startIdx: number; endIdx: number } | null) => void;
}

const convertToCytoscape = (
  tree: TreeNode,
  parentId: string | null = null,
  nodes: any[] = [],
  edges: any[] = [],
  idCounter = { value: 0 }
): { nodes: any[]; edges: any[] } => {
  const id = `node-${idCounter.value++}`;
  
  const hasChildren = tree.children && tree.children.length > 0;
  const isTerminal = !hasChildren;
  const isCollapsed = tree.attributes?.type === 'collapsed' || tree.attributes?.type === 'collapsed-terminal';
  const nodeValue = tree.attributes?.value;
  
  let displayName: string;
  let isTruncated = false;
  
  const isCollapsedPath = isCollapsed || tree.name.includes(' → ');
  
  if (isCollapsedPath && tree.name.includes(' → ')) {
    const pathParts = tree.name.split(' → ');
    const chainDepth = pathParts.length;
    displayName = pathParts[pathParts.length - 1];
    isTruncated = chainDepth > 1;
  } else {
    const maxNameLength = 30;
    isTruncated = tree.name.length > maxNameLength;
    displayName = isTruncated 
      ? tree.name.substring(0, maxNameLength - 3) + '...' 
      : tree.name;
  }
  
  let displayValue = '';
  let fullValue = '';
  if (nodeValue !== undefined && nodeValue !== null) {
    const valueStr = String(nodeValue);
    fullValue = valueStr;
    const maxValueLength = 40;
    displayValue = valueStr.length > maxValueLength 
      ? valueStr.substring(0, maxValueLength - 3) + '...'
      : valueStr;
  }
  
  const charWidth = 6;
  const padding = 16;
  const width = Math.max(displayName.length * charWidth + padding, 50);
  const height = 28;
  
  const color = isCollapsed ? '#8b5cf6' : isTerminal ? '#06b6d4' : '#3b82f6';
  
  nodes.push({
    data: {
      id,
      label: displayName,
      fullName: tree.name,
      isTruncated,
      valueLabel: displayValue,
      fullValue: fullValue,
      isTerminal,
      isCollapsed,
      color,
      width,
      height,
      interval: tree.interval,
      chainDepth: tree.name.includes(' → ') ? tree.name.split(' → ').length : 1,
    },
  });

  if (parentId) {
    edges.push({
      data: {
        id: `edge-${parentId}-${id}`,
        source: parentId,
        target: id,
      },
    });
  }

  if (tree.children) {
    tree.children.forEach((child) => {
      convertToCytoscape(child, id, nodes, edges, idCounter);
    });
  }

  return { nodes, edges };
};


const TreeView: React.FC<TreeViewProps> = ({ 
  data, 
  optimizeEnabled, 
  fullNodeCount, 
  optimizedNodeCount, 
  onToggleOptimize, 
  onNodeClick 
}) => {
  const [elements, setElements] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{ name: string; fullName: string; value: string; fullValue: string } | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({
    visible: false, x: 0, y: 0, text: '',
  });
  const cyRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const isDark = useIsDarkMode();

  const nodeCount = optimizeEnabled ? optimizedNodeCount : fullNodeCount;
  const compressionPercent = fullNodeCount > 0 
    ? Math.round(((fullNodeCount - optimizedNodeCount) / fullNodeCount) * 100) 
    : 0;

  useEffect(() => {
    if (!data) {
      setElements([]);
      isInitializedRef.current = false;
      return;
    }

    const { nodes, edges } = convertToCytoscape(data);
    setElements([...nodes, ...edges]);
    isInitializedRef.current = false;
  }, [data]);

  const stylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'width': 'data(width)',
        'height': 'data(height)',
        'shape': 'roundrectangle',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#ffffff',
        'font-size': '12px',
        'font-weight': 500,
        'text-wrap': 'none',
        'text-max-width': '150px',
        'border-width': 1,
        'border-color': isDark ? '#334155' : '#e2e8f0',
        'cursor': 'pointer',
      },
    },
    {
      selector: 'node:active',
      style: {
        'overlay-color': '#3b82f6',
        'overlay-opacity': 0.3,
        'overlay-padding': 4,
      },
    },
    {
      selector: 'node[valueLabel]',
      style: {
        'source-label': 'data(valueLabel)',
        'source-text-offset': 25,
        'source-text-background-color': isDark ? '#1e293b' : '#f1f5f9',
        'source-text-background-opacity': 0.95,
        'source-text-background-padding': '3px',
        'source-text-background-shape': 'roundrectangle',
        'color': isDark ? '#e2e8f0' : '#1e293b',
        'font-size': '10px',
      },
    },
    {
      selector: 'node[isTerminal = true]',
      style: {
        'font-size': '11px',
        'font-weight': 400,
      },
    },
    {
      selector: 'node[isCollapsed = true]',
      style: {
        'font-weight': 600,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': isDark ? '#475569' : '#94a3b8',
        'target-arrow-color': isDark ? '#475569' : '#94a3b8',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
      },
    },
  ], [isDark]);

  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.zoom(cy.zoom() * 1.2);
      cy.center();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.zoom(cy.zoom() * 0.8);
      cy.center();
    }
  }, []);

  const handleReset = useCallback(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.resize();
      if (cy.elements().length > 0) {
        cy.fit(cy.elements(), 30);
      }
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await cardRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        if (cyRef.current && cyRef.current.elements().length > 0) {
          cyRef.current.fit(cyRef.current.elements(), 30);
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Tree Visualization</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-4rem)] text-muted-foreground text-sm">
          No tree data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={cardRef} className="h-full flex flex-col">
      <CardHeader className="flex-none pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Tree Visualization</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {optimizeEnabled ? (
                <>
                  Optimized: <strong>{nodeCount}</strong> nodes (from {fullNodeCount}, {compressionPercent}% compression)
                </>
              ) : (
                <>
                  Full tree: <strong>{nodeCount}</strong> nodes
                </>
              )}
            </p>
          </div>
          <div className="flex gap-1">
            <Button 
              variant={optimizeEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleOptimize}
              className="gap-1.5"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              {optimizeEnabled ? 'Optimized' : 'Full'}
            </Button>
            <div className="border-l mx-0.5" />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="Fit to Screen">
              <Shrink className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div className="w-full h-full bg-muted/30">
          <CytoscapeComponent
            elements={elements}
            cy={(cy) => {
              cyRef.current = cy;
              
              if (isInitializedRef.current) return;
              isInitializedRef.current = true;
              
              cy.on('tap', 'node', (event: any) => {
                const node = event.target;
                const nodeData = node.data();
                setSelectedNode({
                  name: nodeData.label,
                  fullName: nodeData.fullName,
                  value: nodeData.valueLabel || '(no value)',
                  fullValue: nodeData.fullValue || '(no value)',
                });
                
                if (onNodeClick && nodeData.interval) {
                  onNodeClick(nodeData.interval);
                } else if (onNodeClick) {
                  onNodeClick(null);
                }
              });
              
              cy.on('tap', (event: any) => {
                if (event.target === cy) {
                  setSelectedNode(null);
                  if (onNodeClick) onNodeClick(null);
                }
              });
              
              cy.on('mouseover', 'node[isTruncated = true]', (event: any) => {
                const node = event.target;
                const nodeData = node.data();
                const renderedPosition = node.renderedPosition();
                
                let tooltipText = nodeData.fullName;
                if (nodeData.isCollapsed && nodeData.chainDepth > 1) {
                  tooltipText = `${nodeData.fullName} (${nodeData.chainDepth} nodes collapsed)`;
                }
                
                setTooltip({
                  visible: true,
                  x: renderedPosition.x,
                  y: renderedPosition.y - 30,
                  text: tooltipText,
                });
              });
              
              cy.on('mouseout', 'node[isTruncated = true]', () => {
                setTooltip({ visible: false, x: 0, y: 0, text: '' });
              });
              
              if (elements.length > 0) {
                cy.layout({
                  name: 'dagre',
                  rankDir: 'TB',
                  nodeSep: 20,
                  rankSep: 50,
                  fit: true,
                  padding: 30,
                  animate: false,
                } as any).run();
                
                setTimeout(() => {
                  if (cy.elements().length > 0) {
                    cy.fit(cy.elements(), 30);
                  }
                }, 100);
              }
            }}
            style={{ width: '100%', height: '100%' }}
            stylesheet={stylesheet}
            wheelSensitivity={0.2}
            minZoom={0.1}
            maxZoom={3}
          />
        </div>
        
        {tooltip.visible && (
          <div
            className="absolute z-50 pointer-events-none bg-background/95 border text-foreground px-3 py-2 rounded text-xs font-mono max-w-lg"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              wordBreak: 'break-word',
            }}
          >
            {tooltip.text}
          </div>
        )}
        
        {selectedNode && (
          <div className="absolute bottom-4 left-4 bg-background/95 border px-4 py-3 rounded-lg max-w-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Selected Node</div>
                <div className="font-mono text-sm font-medium text-foreground break-all">
                  {selectedNode.fullName}
                </div>
                {selectedNode.value !== '(no value)' && (
                  <div className="mt-1.5">
                    <div className="text-xs text-muted-foreground mb-0.5">Value:</div>
                    <div className="font-mono text-sm text-foreground bg-muted px-2 py-1 rounded break-all">
                      {selectedNode.fullValue}
                    </div>
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedNode(null)}
                className="h-6 w-6 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/90 px-3 py-2 rounded border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#3b82f6]" />
              <span>Branch</span>
            </div>
            {optimizeEnabled && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#8b5cf6]" />
                <span>Collapsed</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#06b6d4]" />
              <span>Terminal</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreeView;
