import React, { useState } from 'react';
import type { ASTNode } from '@/types/ast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JsonViewProps {
  data: ASTNode | null;
}

interface CollapsibleJsonProps {
  data: any;
  name?: string;
  depth?: number;
  isLast?: boolean;
}

const CollapsibleJson: React.FC<CollapsibleJsonProps> = ({ data, name, depth = 0, isLast = true }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  
  const isObject = typeof data === 'object' && data !== null && !Array.isArray(data);
  const isArray = Array.isArray(data);
  const isPrimitive = !isObject && !isArray;
  const hasChildren = (isObject || isArray) && Object.keys(data).length > 0;

  const renderPrimitive = (value: any) => {
    if (typeof value === 'string') {
      return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-orange-600 dark:text-orange-400">{value}</span>;
    }
    if (typeof value === 'boolean' || value === null) {
      return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
    }
    return String(value);
  };

  const renderKey = (key: string) => (
    <span className="text-blue-600 dark:text-blue-400">"{key}"</span>
  );

  if (isPrimitive) {
    return (
      <div className="font-mono text-sm">
        {name && (
          <>
            {renderKey(name)}: {renderPrimitive(data)}
            {!isLast && ','}
          </>
        )}
        {!name && renderPrimitive(data)}
      </div>
    );
  }

  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const entries = isObject ? Object.entries(data) : data.map((item: any, idx: number) => [idx, item]);
  const preview = hasChildren && !isExpanded 
    ? ` ${isArray ? `${entries.length} items` : `${entries.length} keys`} ` 
    : '';

  return (
    <div className="font-mono text-sm">
      <div className="flex items-start">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center justify-center w-4 h-5 mr-1 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        <div className="flex-1">
          {name && (
            <>
              {renderKey(name)}: 
            </>
          )}
          <span className="text-muted-foreground">{openBracket}</span>
          {!isExpanded && hasChildren && (
            <span className="text-muted-foreground italic text-xs ml-1">{preview}</span>
          )}
          {!isExpanded && (
            <span className="text-muted-foreground">{closeBracket}</span>
          )}
          {!isLast && !isExpanded && ','}
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-5 border-l border-border pl-2">
          {entries.map(([key, value]: [string | number, any], idx: number) => (
            <CollapsibleJson
              key={key}
              name={isObject ? String(key) : undefined}
              data={value}
              depth={depth + 1}
              isLast={idx === entries.length - 1}
            />
          ))}
        </div>
      )}
      
      {isExpanded && hasChildren && (
        <div className="flex items-center">
          <span className="w-5" />
          <span className="text-muted-foreground">{closeBracket}</span>
          {!isLast && ','}
        </div>
      )}
    </div>
  );
};

const JsonView: React.FC<JsonViewProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = data ? JSON.stringify(data, null, 2) : '';

  const handleDownload = () => {
    if (!data) return;

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ast-tree.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!jsonString) return;

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>JSON View</CardTitle>
          <CardDescription>View and export the AST as JSON</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-5rem)] text-muted-foreground">
          No data available. Parse a grammar to see the JSON representation.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>JSON View</CardTitle>
            <CardDescription>Interactive collapsible JSON structure</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 bg-slate-50 dark:bg-slate-900">
            <CollapsibleJson data={data} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default JsonView;

