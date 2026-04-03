import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: React.ReactNode;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Getting Started',
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          This tool helps you create and visualize{' '}
          <strong>Ohm.js grammars</strong>. You can:
        </p>
        <ul className="space-y-1.5 text-sm list-disc pl-5">
          <li>Write grammar rules in the code editor</li>
          <li>Parse sample input and visualize the AST</li>
          <li>Inspect rule dependencies</li>
          <li>Get suggestions for grammar improvements</li>
        </ul>
      </div>
    ),
    tip: 'Load an example grammar from the dropdown to get started quickly.',
  },
  {
    id: 'rules',
    title: 'Understanding Rules',
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          A <strong>rule</strong> defines how to parse a piece of text. Each rule has:
        </p>
        <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
          <div>
            <strong>Name:</strong> Identifies the rule (e.g., "Number", "Identifier")
          </div>
          <div>
            <strong>Alternatives:</strong> Different ways the rule can match (connected by |)
          </div>
        </div>
        <p className="text-sm">
          For example, a Number rule might match integers OR decimals.
        </p>
      </div>
    ),
    tip: 'Start rule names with uppercase for structural nodes or lowercase for lexical tokens.',
  },
  {
    id: 'naming',
    title: 'Rule Naming Convention',
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          Ohm.js uses <strong>naming conventions</strong> to distinguish rule types:
        </p>
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <div className="font-mono text-sm font-semibold mb-1">
              Uppercase = Structural
            </div>
            <div className="text-sm text-muted-foreground">
              Example: <code className="bg-muted px-1.5 py-0.5 rounded">Expression</code>,{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded">Statement</code>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              Shows in AST visualization and dependency graph.
            </div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="font-mono text-sm font-semibold mb-1">
              lowercase = Lexical (tokens)
            </div>
            <div className="text-sm text-muted-foreground">
              Example: <code className="bg-muted px-1.5 py-0.5 rounded">identifier</code>,{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded">number</code>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              Collapsed to values in the AST.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'alternatives',
    title: 'Using Alternatives',
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          <strong>Alternatives</strong> let a rule match in different ways:
        </p>
        <div className="bg-muted rounded-lg p-3 space-y-2">
          <div className="font-mono text-sm">
            <div className="text-muted-foreground">// A number can be:</div>
            <div>Alternative 1: digit+</div>
            <div className="text-muted-foreground">|</div>
            <div>Alternative 2: digit+ "." digit+</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          The parser tries each alternative in order until one matches.
        </p>
      </div>
    ),
  },
  {
    id: 'patterns',
    title: 'Built-in Patterns',
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          Ohm.js provides <strong>built-in patterns</strong> for common cases:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="border rounded p-2">
            <code className="font-semibold">digit+</code>
            <div className="text-muted-foreground mt-1">One or more digits</div>
          </div>
          <div className="border rounded p-2">
            <code className="font-semibold">letter+</code>
            <div className="text-muted-foreground mt-1">One or more letters</div>
          </div>
          <div className="border rounded p-2">
            <code className="font-semibold">"text"</code>
            <div className="text-muted-foreground mt-1">Exact match</div>
          </div>
          <div className="border rounded p-2">
            <code className="font-semibold">space*</code>
            <div className="text-muted-foreground mt-1">Optional spaces</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          + means "one or more", * means "zero or more", ? means "optional".
        </p>
      </div>
    ),
  },
];

interface GrammarTutorialProps {
  onClose: () => void;
  onComplete?: () => void;
}

export const GrammarTutorial: React.FC<GrammarTutorialProps> = ({
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full max-w-lg border">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">{step.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Step {currentStep + 1} of {tutorialSteps.length}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="flex-shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="min-h-[180px]">{step.content}</div>

          {step.tip && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs">
                <strong>Tip:</strong> {step.tip}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-1">
              {tutorialSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`
                    h-1.5 rounded-full transition-all
                    ${idx === currentStep
                      ? 'w-4 bg-primary'
                      : idx < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted-foreground/30'
                    }
                  `}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <Button size="sm" onClick={handleNext} className="gap-1.5">
              {currentStep === tutorialSteps.length - 1 ? 'Done' : 'Next'}
              {currentStep < tutorialSteps.length - 1 && (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
