import React, { useState, useEffect } from 'react';
import { useGrammar } from '@/context/GrammarContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Sparkles,
  GripVertical,
  Wand2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AlternativeComposer } from './AlternativeComposer';
import { ruleTemplates } from '@/data/ruleTemplates';

interface Alternative {
  id: string;
  value: string;
  label?: string; // Case label for the alternative (e.g., "plus" from "-- plus")
}

interface Rule {
  id: string;
  name: string;
  alternatives: Alternative[];
  description?: string;
  operator?: '=' | '+=' | ':='; // Rule definition operator
}

interface GrammarBuilderProps {
  onGrammarGenerated: (grammar: string) => void;
  initialGrammar?: string;
}

// Sortable Rule Card Component
const SortableRuleCard: React.FC<{
  rule: Rule;
  rules: Rule[];
  grammarName: string;
  onUpdate: (updates: Partial<Rule>) => void;
  onRemove: () => void;
  onCreateRule: (name: string) => void;
  disabled: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ rule, rules, grammarName, onUpdate, onRemove, onCreateRule, disabled, isCollapsed, onToggleCollapse }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: rule.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const availableRules = rules.filter(r => r.id !== rule.id);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-2 hover:border-primary/50 transition-all">
        <CardHeader className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              disabled={disabled}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Rule Content */}
            <div className="flex-1 space-y-3">
              {/* Collapsed Summary View */}
              {isCollapsed && (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{rule.name || 'Unnamed'}</span>
                      <span className="text-xs text-muted-foreground">
                        {rule.alternatives.length} alternative{rule.alternatives.length !== 1 ? 's' : ''}
                      </span>
                      {rule.description && (
                        <span className="text-xs text-muted-foreground">• {rule.description}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {/^[A-Z]/.test(rule.name) ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          Structural (shows in AST)
                        </span>
                      ) : /^[a-z]/.test(rule.name) ? (
                        <span className="text-slate-600 dark:text-slate-400">
                          Lexical (hidden token)
                        </span>
                      ) : (
                        <span>Not yet named</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onToggleCollapse}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onRemove}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Expanded Full View */}
              {!isCollapsed && (
                <div className="space-y-3">
              {/* Header with Collapse Button */}
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Rule Details</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleCollapse}
                  className="h-7 gap-1"
                >
                  <ChevronUp className="h-3 w-3" />
                  Collapse
                </Button>
              </div>
              
              {/* Rule Name and Description */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Rule Name
                  </label>
                  <Input
                    value={rule.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="RuleName"
                    className="font-mono text-sm h-9"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {/^[A-Z]/.test(rule.name) ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        ✓ Uppercase = Shows in AST
                      </span>
                    ) : /^[a-z]/.test(rule.name) ? (
                      <span className="text-slate-600 dark:text-slate-400">
                        ↓ lowercase = Hidden (lexical token)
                      </span>
                    ) : (
                      <span>Start with uppercase or lowercase</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Description (optional)
                  </label>
                  <Input
                    value={rule.description || ''}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    placeholder="What this rule does"
                    className="text-sm h-9"
                  />
                </div>
              </div>

              {/* Rule Operator */}
              <div className="flex items-center space-x-3">
                <label className="text-xs text-muted-foreground whitespace-nowrap">
                  Rule operator:
                </label>
                <Select
                  value={rule.operator || '='}
                  onValueChange={(value: '=' | '+=' | ':=') => onUpdate({ operator: value })}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="=">
                      <span className="font-mono">=</span> <span className="text-muted-foreground ml-2">Define</span>
                    </SelectItem>
                    <SelectItem value="+=">
                      <span className="font-mono">+=</span> <span className="text-muted-foreground ml-2">Extend</span>
                    </SelectItem>
                    <SelectItem value=":=">
                      <span className="font-mono">:=</span> <span className="text-muted-foreground ml-2">Override</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alternatives */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Alternatives ({rule.alternatives.length})
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newAlt: Alternative = {
                        id: `alt-${grammarName}-${rule.name}-${rule.alternatives.length}`, // Deterministic ID
                        value: '',
                      };
                      onUpdate({
                        alternatives: [...rule.alternatives, newAlt],
                      });
                    }}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Alternative
                  </Button>
                </div>

                {rule.alternatives.map((alt, altIndex) => (
                  <div key={alt.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <AlternativeComposer
                          value={alt.value}
                          onChange={(value) => {
                            const newAlts = rule.alternatives.map(a =>
                              a.id === alt.id ? { ...a, value } : a
                            );
                            onUpdate({ alternatives: newAlts });
                          }}
                          availableRules={availableRules.map(r => ({
                            name: r.name,
                            description: r.description,
                          }))}
                          onCreateRule={onCreateRule}
                        />
                      </div>
                      
                      {/* Inline Case Label */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">--</span>
                        <Input
                          value={alt.label || ''}
                          onChange={(e) => {
                            const newAlts = rule.alternatives.map(a =>
                              a.id === alt.id ? { ...a, label: e.target.value || undefined } : a
                            );
                            onUpdate({ alternatives: newAlts });
                          }}
                          placeholder="label"
                          className="h-8 w-32 text-xs font-mono"
                          title="Case label (optional)"
                        />
                      </div>
                    </div>

                    {rule.alternatives.length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newAlts = rule.alternatives.filter(
                              a => a.id !== alt.id
                            );
                            onUpdate({ alternatives: newAlts });
                          }}
                          className="h-7 gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove Alternative
                        </Button>
                      </div>
                    )}

                    {/* OR separator */}
                    {altIndex < rule.alternatives.length - 1 && (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
                        <div className="px-3 py-1 bg-orange-100 dark:bg-orange-950 border-2 border-orange-300 dark:border-orange-700 rounded-full text-xs font-bold text-orange-700 dark:text-orange-300">
                          OR
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Delete Button */}
              <div className="flex justify-end pt-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRemove}
                  className="text-destructive hover:text-destructive gap-2"
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Rule
                </Button>
              </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

// Helper: Split alternatives by '|' but respect quotes, parens, and brackets
const splitAlternatives = (str: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenDepth = 0;
  let bracketDepth = 0;
  let escapeNext = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      current += char;
      inQuotes = !inQuotes;
      continue;
    }

    if (inQuotes) {
      current += char;
      continue;
    }

    if (char === '(') {
      parenDepth++;
      current += char;
      continue;
    }

    if (char === ')') {
      parenDepth--;
      current += char;
      continue;
    }

    if (char === '[') {
      bracketDepth++;
      current += char;
      continue;
    }

    if (char === ']') {
      bracketDepth--;
      current += char;
      continue;
    }

    // Only split on | if outside all delimiters
    if (char === '|' && parenDepth === 0 && bracketDepth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
};

// Parse grammar text into structured rules
const parseGrammarText = (grammarText: string): { name: string; rules: Rule[] } => {
  if (!grammarText.trim()) {
    return {
      name: 'MyGrammar',
      rules: [
        {
          id: '1',
          name: 'Expr',
          alternatives: [{ id: 'alt-1', value: 'digit+' }],
          description: '',
        },
      ],
    };
  }

  try {
    const nameMatch = grammarText.match(/^(\w+)\s*\{/);
    const name = nameMatch ? nameMatch[1] : 'MyGrammar';

    const rulesSection = grammarText.match(/\{([\s\S]*)\}/);
    if (!rulesSection) {
      return {
        name,
        rules: [
          {
            id: '1',
            name: 'Expr',
            alternatives: [{ id: 'alt-1', value: 'digit+' }],
            description: '',
          },
        ],
      };
    }

    const rulesText = rulesSection[1];
    const lines = rulesText.split('\n').filter(line => line.trim());

    const parsedRules: Rule[] = [];
    let currentRule: Partial<Rule> | null = null;
    let currentDefinition: string[] = [];
    let lastComment = '';
    let currentRuleOperator: '=' | '+=' | ':=' = '=';

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) continue;

      if (trimmed.startsWith('//')) {
        lastComment = trimmed.replace('//', '').trim();
        continue;
      }

      const ruleMatch = trimmed.match(/^(\w+)\s*$/);
      if (ruleMatch && lines[lines.indexOf(line) + 1]?.includes('=')) {
        if (currentRule && currentRule.name) {
          const ruleName = currentRule.name; // Store for use in callbacks
          const fullDef = currentDefinition.join(' ').trim();
          const alternatives = splitAlternatives(fullDef)
            .map((alt, idx) => {
              const trimmedAlt = alt.trim();
              // Check for case label (-- labelName)
              const labelMatch = trimmedAlt.match(/^(.+?)\s*--\s*(\w+)\s*$/);
              if (labelMatch) {
                return {
                  id: `alt-${name}-${ruleName}-${idx}`, // Deterministic ID with grammar name
                  value: labelMatch[1].trim(),
                  label: labelMatch[2].trim(),
                };
              }
              return {
                id: `alt-${name}-${ruleName}-${idx}`, // Deterministic ID with grammar name
                value: trimmedAlt,
              };
            })
            .filter(alt => alt.value);

          parsedRules.push({
            id: `rule-${name}-${ruleName}`, // Deterministic ID with grammar name prefix
            name: ruleName,
            alternatives:
              alternatives.length > 0
                ? alternatives
                : [{ id: `alt-${name}-${ruleName}-0`, value: '' }],
            description: lastComment,
            operator: currentRuleOperator,
          });
          lastComment = '';
        }

        currentRule = { name: ruleMatch[1] };
        currentDefinition = [];
        currentRuleOperator = '=';
        continue;
      }

      if (trimmed.startsWith(':=')) {
        currentRuleOperator = ':=';
        const def = trimmed.substring(2).trim();
        if (!def.startsWith('//')) {
          currentDefinition.push(def);
        }
      } else if (trimmed.startsWith('+=')) {
        currentRuleOperator = '+=';
        const def = trimmed.substring(2).trim();
        if (!def.startsWith('//')) {
          currentDefinition.push(def);
        }
      } else if (trimmed.startsWith('=')) {
        currentRuleOperator = '=';
        const def = trimmed.substring(1).trim();
        if (!def.startsWith('//')) {
          currentDefinition.push(def);
        }
      } else if (trimmed.startsWith('|')) {
        const def = trimmed.substring(1).trim();
        if (!def.startsWith('//')) {
          currentDefinition.push('|');
          currentDefinition.push(def);
        }
      } else if (currentRule && !trimmed.startsWith('//')) {
        if (trimmed) {
          currentDefinition.push(trimmed);
        }
      }
    }

    if (currentRule && currentRule.name) {
      const ruleName = currentRule.name;
      const fullDef = currentDefinition.join(' ').trim();
      const alternatives = splitAlternatives(fullDef)
        .map((alt, idx) => {
          const trimmedAlt = alt.trim();
          // Check for case label (-- labelName)
          const labelMatch = trimmedAlt.match(/^(.+?)\s*--\s*(\w+)\s*$/);
          if (labelMatch) {
            return {
              id: `alt-${name}-${ruleName}-${idx}`, // Deterministic ID with grammar name
              value: labelMatch[1].trim(),
              label: labelMatch[2].trim(),
            };
          }
          return {
            id: `alt-${name}-${ruleName}-${idx}`, // Deterministic ID with grammar name
            value: trimmedAlt,
          };
        })
        .filter(alt => alt.value);

      parsedRules.push({
        id: `rule-${name}-${ruleName}`, // Deterministic ID with grammar name prefix
        name: ruleName,
        alternatives:
          alternatives.length > 0
            ? alternatives
            : [{ id: `alt-${name}-${ruleName}-0`, value: '' }],
        description: lastComment,
        operator: currentRuleOperator,
      });
    }

    return {
      name,
      rules:
        parsedRules.length > 0
          ? parsedRules
          : [
              {
                id: '1',
                name: 'Expr',
                alternatives: [{ id: 'alt-1', value: 'digit+' }],
                description: '',
              },
            ],
    };
  } catch (error) {
    console.error('Error parsing grammar:', error);
    return {
      name: 'MyGrammar',
      rules: [
        {
          id: '1',
          name: 'Expr',
          alternatives: [{ id: 'alt-1', value: 'digit+' }],
          description: '',
        },
      ],
    };
  }
};

const GrammarBuilder: React.FC<GrammarBuilderProps> = ({
  onGrammarGenerated,
  initialGrammar,
}) => {
  const { collapsedRules, toggleRuleCollapsed } = useGrammar();
  const [grammarName, setGrammarName] = useState('MyGrammar');
  const [rules, setRules] = useState<Rule[]>([
    {
      id: '1',
      name: 'Expr',
      alternatives: [{ id: 'alt-1', value: 'digit+' }],
      description: 'Main expression',
    },
  ]);
  const [lastSyncedGrammar, setLastSyncedGrammar] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync from code editor to visual builder
  useEffect(() => {
    if (
      initialGrammar &&
      initialGrammar !== lastSyncedGrammar &&
      initialGrammar.trim()
    ) {
      const parsed = parseGrammarText(initialGrammar);
      setGrammarName(parsed.name);
      setRules(parsed.rules);
      setLastSyncedGrammar(initialGrammar);
    }
  }, [initialGrammar, lastSyncedGrammar]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex(r => r.id === active.id);
      const newIndex = rules.findIndex(r => r.id === over.id);

      setRules(arrayMove(rules, oldIndex, newIndex));
    }
  };

  const addRule = () => {
    const ruleName = `Rule${rules.length + 1}`;
    const newRule: Rule = {
      id: `rule-${grammarName}-${ruleName}`, // Deterministic ID with grammar name
      name: ruleName,
      alternatives: [{ id: `alt-${grammarName}-${ruleName}-0`, value: '' }],
      description: '',
    };
    setRules([...rules, newRule]);
  };

  const addRuleFromTemplate = (templateId: string) => {
    const template = ruleTemplates.find(t => t.id === templateId);
    if (!template) return;

    const ruleName = template.ruleName;
    const newRule: Rule = {
      id: `rule-${grammarName}-${ruleName}`, // Deterministic ID with grammar name
      name: ruleName,
      alternatives: template.alternatives.map((alt, idx) => ({
        id: `alt-${grammarName}-${ruleName}-${idx}`, // Deterministic ID with grammar name
        value: alt,
      })),
      description: template.description,
    };
    setRules([...rules, newRule]);
    setShowTemplateDialog(false);
  };

  const createRuleInline = (name: string) => {
    // Check if rule already exists
    if (rules.some(r => r.name === name)) {
      return;
    }

    const newRule: Rule = {
      id: `rule-${grammarName}-${name}`, // Deterministic ID with grammar name
      name,
      alternatives: [{ id: `alt-${grammarName}-${name}-0`, value: '' }],
      description: '',
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map(rule => (rule.id === id ? { ...rule, ...updates } : rule)));
  };

  const removeRule = (id: string) => {
    if (rules.length === 1) return;
    setRules(rules.filter(rule => rule.id !== id));
  };

  const generateGrammar = () => {
    const lines: string[] = [`${grammarName} {`];

    rules.forEach((rule, index) => {
      if (index > 0) {
        lines.push('');
      }

      if (rule.description) {
        lines.push(`  // ${rule.description}`);
      }

      lines.push(`  ${rule.name}`);

      rule.alternatives.forEach((alt, altIndex) => {
        const trimmedValue = alt.value.trim();
        if (trimmedValue) {
          const altText = alt.label ? `${trimmedValue}  -- ${alt.label}` : trimmedValue;
          if (altIndex === 0) {
            const operator = rule.operator || '=';
            lines.push(`    ${operator} ${altText}`);
          } else {
            lines.push(`    | ${altText}`);
          }
        }
      });
    });

    lines.push('}');

    const grammar = lines.join('\n');
    setLastSyncedGrammar(grammar);
    onGrammarGenerated(grammar);
  };

  // Auto-generate when rules or grammar name changes
  useEffect(() => {
    if (rules.length > 0 && grammarName.trim()) {
      const timeoutId = setTimeout(() => {
        generateGrammar();
      }, 800);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules, grammarName]);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Visual Grammar Builder</p>
            <p className="text-xs text-muted-foreground mt-1">
              Build grammars visually with drag-and-drop, autocomplete, and smart
              suggestions
            </p>
          </div>
        </div>
      </div>

      {/* Grammar Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">Grammar Name</label>
        <Input
          value={grammarName}
          onChange={(e) => setGrammarName(e.target.value)}
          placeholder="MyGrammar"
          className="font-mono"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={addRule}
          className="gap-2 flex-1"
        >
          <Plus className="h-4 w-4" />
          Add Empty Rule
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTemplateDialog(true)}
          className="gap-2 flex-1"
        >
          <Wand2 className="h-4 w-4" />
          Add from Template
        </Button>
      </div>

      {/* Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Rule Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick-start with common patterns
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowTemplateDialog(false)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 overflow-auto">
              <div className="grid grid-cols-2 gap-3">
                {ruleTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => addRuleFromTemplate(template.id)}
                    className="text-left p-3 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </div>
                        <code className="text-xs font-mono text-primary mt-1 block">
                          {template.ruleName}
                        </code>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules List with Drag and Drop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Rules ({rules.length})</label>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Drag to reorder
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rules.map(r => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {rules.map(rule => (
                <SortableRuleCard
                  key={rule.id}
                  rule={rule}
                  rules={rules}
                  grammarName={grammarName}
                  onUpdate={(updates) => updateRule(rule.id, updates)}
                  onRemove={() => removeRule(rule.id)}
                  onCreateRule={createRuleInline}
                  disabled={rules.length === 1}
                  isCollapsed={collapsedRules.has(rule.id)}
                  onToggleCollapse={() => toggleRuleCollapsed(rule.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default GrammarBuilder;
