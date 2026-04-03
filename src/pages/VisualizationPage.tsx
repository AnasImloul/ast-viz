import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary from '@/components/ErrorBoundary';
import TreeView from '@/components/TreeView';
import JsonView from '@/components/JsonView';
import { SyntaxHighlightedEditor } from '@/components/SyntaxHighlightedEditor';
import { useGrammar } from '@/context/GrammarContext';
import { Braces, Network, Play, AlertCircle, PanelLeftClose, PanelLeftOpen, GripVertical, Loader2 } from 'lucide-react';

const VisualizationPage: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    ast,
    optimizedTree,
    fullTree,
    error,
    programText,
    setProgramText,
    parseGrammar,
    grammar,
    getGrammarAsText,
    fullNodeCount,
    optimizedNodeCount,
  } = useGrammar();
  
  const [optimizeEnabled, setOptimizeEnabled] = useState(true);
  const tree = optimizeEnabled ? optimizedTree : fullTree;

  const [inputFocused, setInputFocused] = useState(false);
  const [isInputPanelCollapsed, setIsInputPanelCollapsed] = useState(false);
  const [autoParseEnabled, setAutoParseEnabled] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<{ startIdx: number; endIdx: number } | null>(null);
  const inputPanelRef = useRef<any>(null);

  useEffect(() => {
    const grammarText = getGrammarAsText();
    if (!grammarText.trim()) {
      navigate('/grammar/code');
    }
  }, [grammar, navigate, getGrammarAsText]);

  useEffect(() => {
    const grammarText = getGrammarAsText();
    if (!autoParseEnabled || !programText.trim() || !grammarText.trim()) {
      setIsParsing(false);
      return;
    }

    setIsParsing(true);
    const timeoutId = setTimeout(() => {
      parseGrammar();
      setIsParsing(false);
    }, 600);

    return () => {
      clearTimeout(timeoutId);
      setIsParsing(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programText, autoParseEnabled, grammar]);

  const handleToggleOptimize = () => {
    setOptimizeEnabled(!optimizeEnabled);
  };

  const handleParse = () => {
    parseGrammar();
  };

  const handleToggleInputPanel = () => {
    if (inputPanelRef.current) {
      if (isInputPanelCollapsed) {
        inputPanelRef.current.expand();
      } else {
        inputPanelRef.current.collapse();
      }
      setIsInputPanelCollapsed(!isInputPanelCollapsed);
    }
  };

  const programLineCount = programText.split('\n').length;

  return (
    <>
      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel
            ref={inputPanelRef}
            defaultSize={30}
            minSize={20}
            maxSize={50}
            collapsible={true}
            onCollapse={() => setIsInputPanelCollapsed(true)}
            onExpand={() => setIsInputPanelCollapsed(false)}
          >
            <div className="h-full overflow-auto p-4 space-y-3">
              <Card className={`border transition-colors ${
                error ? 'border-red-500' :
                inputFocused ? 'border-primary' : 
                isParsing ? 'border-yellow-500/50' : ''
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Program Text</CardTitle>
                      {isParsing && (
                        <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={autoParseEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoParseEnabled(!autoParseEnabled)}
                        className="h-7 text-xs"
                        title={autoParseEnabled ? "Auto-parse enabled" : "Auto-parse disabled"}
                      >
                        {autoParseEnabled ? 'Auto' : 'Manual'}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {programLineCount} lines
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs font-mono whitespace-pre-wrap">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div
                    className={`border rounded-md bg-muted/30 overflow-hidden ${
                      inputFocused ? 'border-primary' : error ? 'border-red-300 dark:border-red-800' : ''
                    }`}
                    style={{ 
                      height: 'clamp(120px, 60vh, 800px)',
                    }}
                  >
                    <SyntaxHighlightedEditor
                      value={programText}
                      ast={ast}
                      onChange={setProgramText}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Enter text to parse..."
                      className="w-full h-full"
                      selectedInterval={selectedInterval}
                    />
                  </div>
                  
                  {!autoParseEnabled && (
                    <Button 
                      onClick={handleParse} 
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Play className="h-4 w-4" />
                      Parse
                    </Button>
                  )}
                </CardContent>
              </Card>

              {autoParseEnabled && (
                <p className="text-xs text-muted-foreground">
                  Auto-parse active: tree updates as you type (600ms debounce).
                </p>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors relative group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </PanelResizeHandle>

          <Panel defaultSize={70} minSize={30}>
            <div className="h-full overflow-hidden p-4 relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleInputPanel}
                className="absolute top-4 left-4 z-10 gap-1.5"
                title={isInputPanelCollapsed ? "Show Input Panel" : "Hide Input Panel"}
              >
                {isInputPanelCollapsed ? (
                  <>
                    <PanelLeftOpen className="h-4 w-4" />
                    Show Input
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    Hide Input
                  </>
                )}
              </Button>

              <Tabs defaultValue="tree" className="h-full flex flex-col">
                <TabsList className="w-fit mx-auto">
                  <TabsTrigger value="tree" className="gap-1.5">
                    <Network className="h-4 w-4" />
                    Tree
                  </TabsTrigger>
                  <TabsTrigger value="json" className="gap-1.5">
                    <Braces className="h-4 w-4" />
                    JSON
                  </TabsTrigger>
                </TabsList>
            
                <div className="flex-1 mt-3 overflow-hidden">
                  <TabsContent value="tree" className="h-full m-0">
                    {tree ? (
                      <div className="relative h-full flex flex-col">
                        <p className="mb-2 text-xs text-muted-foreground">
                          <span className="font-mono">Uppercase</span> rules appear in tree.{' '}
                          <span className="font-mono">lowercase</span> rules are lexical tokens.
                        </p>
                        
                        <div className="flex-1 overflow-hidden">
                          <ErrorBoundary fallbackTitle="Tree View Error">
                            <TreeView
                              data={tree}
                              optimizeEnabled={optimizeEnabled}
                              fullNodeCount={fullNodeCount}
                              optimizedNodeCount={optimizedNodeCount}
                              onToggleOptimize={handleToggleOptimize}
                              onNodeClick={setSelectedInterval}
                            />
                          </ErrorBoundary>
                        </div>
                        {error && (
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-400 dark:border-yellow-600 rounded px-3 py-1.5">
                            <p className="text-xs text-yellow-900 dark:text-yellow-100">
                              Showing last valid parse
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-2">
                          <Network className="h-12 w-12 mx-auto opacity-20" />
                          <p className="text-sm font-medium">No AST to display</p>
                          <p className="text-xs">Enter program text and parse to see the tree</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
              
                  <TabsContent value="json" className="h-full m-0">
                    {ast ? (
                      <div className="relative h-full">
                        <ErrorBoundary fallbackTitle="JSON View Error">
                          <JsonView data={ast} />
                        </ErrorBoundary>
                        {error && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-400 dark:border-yellow-600 rounded px-3 py-1.5 z-10">
                            <p className="text-xs text-yellow-900 dark:text-yellow-100">
                              Showing last valid parse
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-2">
                          <Braces className="h-12 w-12 mx-auto opacity-20" />
                          <p className="text-sm font-medium">No AST to display</p>
                          <p className="text-xs">Enter program text and parse to see the JSON</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </Panel>
        </PanelGroup>
      </main>
    </>
  );
};

export default VisualizationPage;
