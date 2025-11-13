import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  Target,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Grammar Builder',
    description: 'Learn the basics of building grammars visually',
    icon: BookOpen,
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          This visual grammar builder helps you create{' '}
          <strong>Ohm.js grammars</strong> without writing code. Perfect for:
        </p>
        <ul className="space-y-2 text-sm list-none">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Creating parsers for custom languages</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Teaching compiler concepts</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Prototyping language designs</span>
          </li>
        </ul>
      </div>
    ),
    tip: 'This tutorial will guide you through creating your first grammar in 5 steps.',
  },
  {
    id: 'rules',
    title: 'Understanding Rules',
    description: 'Rules are the building blocks of your grammar',
    icon: Target,
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          A <strong>rule</strong> defines how to parse a piece of text. Each rule has:
        </p>
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 space-y-2 text-sm">
          <div>
            <strong className="text-blue-600 dark:text-blue-400">Name:</strong>{' '}
            Identifies the rule (e.g., "Number", "Identifier")
          </div>
          <div>
            <strong className="text-blue-600 dark:text-blue-400">Alternatives:</strong>{' '}
            Different ways the rule can match (connected by OR)
          </div>
        </div>
        <p className="text-sm">
          For example, a Number rule might match integers OR decimals.
        </p>
      </div>
    ),
    tip: 'Start rule names with uppercase (e.g., Expression) for structural nodes or lowercase (e.g., identifier) for lexical tokens.',
  },
  {
    id: 'naming',
    title: 'Rule Naming Convention',
    description: 'Uppercase vs lowercase rule names',
    icon: Target,
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          Ohm.js uses <strong>naming conventions</strong> to distinguish rule types:
        </p>
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Uppercase = Structural
            </div>
            <div className="text-sm text-muted-foreground">
              Example: <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">Expression</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">Statement</code>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              ✓ Shows in AST visualization<br/>
              ✓ Shows in dependency graph
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
              lowercase = Lexical (tokens)
            </div>
            <div className="text-sm text-muted-foreground">
              Example: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">identifier</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">number</code>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              ✗ Hidden from AST (collapsed to values)<br/>
              ✗ Hidden from dependency graph
            </div>
          </div>
        </div>
      </div>
    ),
    tip: 'Use lowercase for rules that define tokens (like identifiers, numbers, strings) and uppercase for structure (like statements, expressions).',
  },
  {
    id: 'alternatives',
    title: 'Using Alternatives',
    description: 'Define multiple matching patterns for a rule',
    icon: Zap,
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          <strong>Alternatives</strong> let a rule match in different ways:
        </p>
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 space-y-2">
          <div className="font-mono text-sm">
            <div className="text-muted-foreground">// A number can be:</div>
            <div className="text-blue-600">Alternative 1: digit+</div>
            <div className="text-orange-600">OR</div>
            <div className="text-blue-600">Alternative 2: digit+ "." digit+</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          The parser tries each alternative in order until one matches.
        </p>
      </div>
    ),
    tip: 'Use the "Add Alternative" button to create multiple matching patterns.',
  },
  {
    id: 'linking',
    title: 'Linking Rules',
    description: 'Reference other rules to build complex patterns',
    icon: Target,
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          Rules can <strong>reference other rules</strong> to create hierarchies:
        </p>
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 space-y-2">
          <div className="font-mono text-sm space-y-1">
            <div>
              <span className="text-purple-600">Expression</span> ={' '}
              <span className="text-blue-600">Number</span>
            </div>
            <div>
              <span className="text-purple-600">Number</span> = digit+
            </div>
          </div>
        </div>
        <p className="text-sm">
          Click the <strong>rule name buttons</strong> below each alternative to
          quickly insert references.
        </p>
      </div>
    ),
    tip: 'Use the dependency graph view to see how your rules connect.',
  },
  {
    id: 'patterns',
    title: 'Built-in Patterns',
    description: 'Use common patterns like digit+, letter+, and space*',
    icon: Zap,
    content: (
      <div className="space-y-3">
        <p className="text-sm">
          Ohm.js provides <strong>built-in patterns</strong> for common cases:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded p-2">
            <code className="font-semibold">digit+</code>
            <div className="text-muted-foreground mt-1">One or more digits</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded p-2">
            <code className="font-semibold">letter+</code>
            <div className="text-muted-foreground mt-1">One or more letters</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded p-2">
            <code className="font-semibold">"text"</code>
            <div className="text-muted-foreground mt-1">Exact match</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded p-2">
            <code className="font-semibold">space*</code>
            <div className="text-muted-foreground mt-1">Optional spaces</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the pattern library for more options!
        </p>
      </div>
    ),
    tip: 'The + means "one or more", * means "zero or more", ? means "optional".',
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
  const Icon = step.icon;

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

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2">
        {/* Header */}
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content with AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Content */}
              <div className="min-h-[200px]">{step.content}</div>

              {/* Tip */}
              {step.tip && (
                <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="text-amber-900 dark:text-amber-100">
                      Tip:
                    </strong>{' '}
                    <span className="text-amber-800 dark:text-amber-200">
                      {step.tip}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-2"
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
                    h-2 rounded-full transition-all
                    ${
                      idx === currentStep
                        ? 'w-6 bg-primary'
                        : idx < currentStep
                        ? 'w-2 bg-primary/50'
                        : 'w-2 bg-slate-300 dark:bg-slate-700'
                    }
                  `}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <Button onClick={handleNext} className="gap-2">
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle2 className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

