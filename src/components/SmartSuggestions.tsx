import React, { useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { analyzeGrammar, getGrammarSuggestions, type GrammarSuggestion } from '@/lib/grammarAnalysis';

interface SmartSuggestionsProps {
  grammarText: string;
  onApplyFix?: (rule: string, fix: string) => void;
  onDismiss?: (suggestionIndex: number) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  grammarText,
  onApplyFix,
  onDismiss,
}) => {
  const suggestions = useMemo(() => {
    if (!grammarText.trim()) return [];
    const analysis = analyzeGrammar(grammarText);
    return getGrammarSuggestions(analysis);
  }, [grammarText]);

  const [dismissed, setDismissed] = React.useState<Set<number>>(new Set());

  const visibleSuggestions = suggestions.filter((_, idx) => !dismissed.has(idx));

  const handleDismiss = (index: number) => {
    setDismissed(prev => new Set(prev).add(index));
    onDismiss?.(index);
  };

  const getIcon = (type: GrammarSuggestion['type']) => {
    switch (type) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  };

  const getVariant = (type: GrammarSuggestion['type']) => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      case 'info':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const getColorClass = (type: GrammarSuggestion['type']) => {
    switch (type) {
      case 'error':
        return 'text-bad';
      case 'warning':
        return 'text-primary';
      case 'info':
        return 'text-accent2';
      default:
        return 'text-muted-foreground';
    }
  };

  if (visibleSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg">
        <CheckCircle2 className="h-10 w-10 text-good mb-2" />
        <p className="font-medium text-sm">All good!</p>
        <p className="text-xs text-muted-foreground mt-1">
          No issues or suggestions for your grammar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Smart Suggestions ({visibleSuggestions.length})
        </h4>
        {dismissed.size > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(new Set())}
            className="text-xs h-7"
          >
            Show All ({suggestions.length})
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[calc(100vh-20rem)]">
        <div className="space-y-2 pr-4">
          {visibleSuggestions.map((suggestion) => {
            const Icon = getIcon(suggestion.type);
            const originalIndex = suggestions.indexOf(suggestion);

            return (
              <Alert
                key={originalIndex}
                variant={getVariant(suggestion.type)}
                className="relative"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${getColorClass(suggestion.type)}`} />
                  
                  <div className="flex-1 space-y-2">
                    <AlertDescription className="text-sm">
                      {suggestion.rule && (
                        <code className="font-mono font-semibold bg-background px-1.5 py-0.5 rounded">
                          {suggestion.rule}
                        </code>
                      )}{' '}
                      {suggestion.message}
                    </AlertDescription>

                    {suggestion.fix && (
                      <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border">
                        <strong>Suggestion:</strong> {suggestion.fix}
                      </div>
                    )}

                    {onApplyFix && suggestion.fix && suggestion.rule && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplyFix(suggestion.rule!, suggestion.fix!)}
                        className="h-7 text-xs"
                      >
                        Apply Fix
                      </Button>
                    )}
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDismiss(originalIndex)}
                    className="h-6 w-6 flex-shrink-0 -mt-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Alert>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

