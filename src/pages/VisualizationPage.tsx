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
import { Switch } from '@/components/ui/switch';

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
  const panelGroupContainerRef = useRef<HTMLDivElement>(null);
  const [panelGroupWidth, setPanelGroupWidth] = useState(window.innerWidth);

  useEffect(() => {
    const el = panelGroupContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setPanelGroupWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const leftPanelMinSize = Math.min(50, (600 / panelGroupWidth) * 100);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const inputCardContent = (
    <Card className={`border transition-colors flex flex-col flex-1 min-h-0 ${
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
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <Switch
                checked={autoParseEnabled}
                onCheckedChange={setAutoParseEnabled}
                aria-label="Toggle auto-parse"
              />
              <span className="text-xs text-muted-foreground">Auto-parse</span>
            </label>
            <span className="text-xs text-muted-foreground">
              {programLineCount} lines
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 min-h-0 flex flex-col gap-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-mono whitespace-pre-wrap">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div
          className={`flex-1 min-h-0 border rounded-md bg-muted/30 overflow-hidden ${
            inputFocused ? 'border-primary' : error ? 'border-red-300 dark:border-red-800' : ''
          }`}
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
  );

  const treeContent = (
    <>
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
    </>
  );

  const jsonContent = (
    <>
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
    </>
  );

  if (isMobile) {
    return (
      <>
        <main className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="input" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 pt-2 flex-none">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="input" className="gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  Input
                </TabsTrigger>
                <TabsTrigger value="tree" className="gap-1.5">
                  <Network className="h-3.5 w-3.5" />
                  Tree
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-1.5">
                  <Braces className="h-3.5 w-3.5" />
                  JSON
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden mt-2">
              <TabsContent value="input" className="h-full m-0 overflow-hidden">
                <div className="h-full flex flex-col p-3 gap-3">
                  {inputCardContent}
                  {autoParseEnabled && (
                    <p className="text-xs text-muted-foreground flex-none">
                      Auto-parse active: tree updates as you type (600ms debounce).
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tree" className="h-full m-0 overflow-hidden p-3">
                {treeContent}
              </TabsContent>

              <TabsContent value="json" className="h-full m-0 overflow-hidden p-3">
                {jsonContent}
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="flex-1 overflow-hidden">
        <div ref={panelGroupContainerRef} className="h-full">
        <PanelGroup direction="horizontal">
          <Panel
            ref={inputPanelRef}
            defaultSize={30}
            minSize={leftPanelMinSize}
            maxSize={50}
            collapsible={true}
            onCollapse={() => setIsInputPanelCollapsed(true)}
            onExpand={() => setIsInputPanelCollapsed(false)}
          >
            <div className="h-full flex flex-col overflow-hidden p-4 gap-3">
              {inputCardContent}

              {autoParseEnabled && (
                <p className="text-xs text-muted-foreground flex-none">
                  Auto-parse active: tree updates as you type (600ms debounce).
                </p>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className={`transition-all relative group ${
            isInputPanelCollapsed
              ? 'w-3 bg-border/60 hover:bg-primary/40 cursor-col-resize'
              : 'w-1 bg-border hover:bg-primary/50'
          }`}>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded p-1 transition-opacity ${
              isInputPanelCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </PanelResizeHandle>

          <Panel defaultSize={70} minSize={30}>
            <div className="h-full overflow-hidden p-4 flex flex-col gap-3">
              <Tabs defaultValue="tree" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between flex-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleInputPanel}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    title={isInputPanelCollapsed ? "Show Input Panel" : "Hide Input Panel"}
                  >
                    {isInputPanelCollapsed ? (
                      <>
                        <PanelLeftOpen className="h-4 w-4" />
                        <span className="text-xs">Show Input</span>
                      </>
                    ) : (
                      <>
                        <PanelLeftClose className="h-4 w-4" />
                        <span className="text-xs">Hide Input</span>
                      </>
                    )}
                  </Button>

                  <TabsList className="w-fit">
                    <TabsTrigger value="tree" className="gap-1.5">
                      <Network className="h-4 w-4" />
                      Tree
                    </TabsTrigger>
                    <TabsTrigger value="json" className="gap-1.5">
                      <Braces className="h-4 w-4" />
                      JSON
                    </TabsTrigger>
                  </TabsList>

                  {/* spacer to balance the left button */}
                  <div className="w-[100px]" />
                </div>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="tree" className="h-full m-0">
                    {treeContent}
                  </TabsContent>

                  <TabsContent value="json" className="h-full m-0">
                    {jsonContent}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </Panel>
        </PanelGroup>
        </div>
      </main>
    </>
  );
};

export default VisualizationPage;
