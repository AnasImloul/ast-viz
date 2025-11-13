import React, { useState, useRef, useEffect } from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { RuleChip, type ChipType } from './RuleChip';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StaticRuleChip } from './RuleChip';

export interface SequenceElement {
  id: string;
  value: string;
  type: ChipType;
}

interface AlternativeComposerProps {
  value: string;
  onChange: (value: string) => void;
  availableRules: Array<{ name: string; description?: string }>;
  onCreateRule?: (suggestedName: string) => void;
}

export const AlternativeComposer: React.FC<AlternativeComposerProps> = ({
  value,
  onChange,
  availableRules,
  onCreateRule,
}) => {
  const [elements, setElements] = useState<SequenceElement[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Parse value into elements on mount and when value changes externally
  useEffect(() => {
    const currentValue = elementsToValue(elements);
    // Only parse if value differs from current elements
    if (value && value !== currentValue) {
      const parsed = parseValueToElements(value);
      setElements(parsed);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse string value into sequence elements
  const parseValueToElements = (val: string): SequenceElement[] => {
    if (!val.trim()) return [];

    const tokens: SequenceElement[] = [];
    let currentToken = '';
    let inQuotes = false;
    let parenDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;
    let escapeNext = false;

    for (let i = 0; i < val.length; i++) {
      const char = val[i];

      if (escapeNext) {
        currentToken += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        currentToken += char;
        escapeNext = true;
        continue;
      }

      // Track parentheses depth (before quote handling)
      if (!inQuotes && char === '(') {
        parenDepth++;
        currentToken += char;
        continue;
      }

      if (!inQuotes && char === ')') {
        parenDepth--;
        currentToken += char;
        continue;
      }

      // Track brackets depth (before quote handling)
      if (!inQuotes && char === '[') {
        bracketDepth++;
        currentToken += char;
        continue;
      }

      if (!inQuotes && char === ']') {
        bracketDepth--;
        currentToken += char;
        continue;
      }

      // Track angle brackets depth (for parameterized rules like listOf<T, S>)
      if (!inQuotes && char === '<') {
        angleDepth++;
        currentToken += char;
        continue;
      }

      if (!inQuotes && char === '>') {
        angleDepth--;
        currentToken += char;
        continue;
      }

      // Handle quotes
      if (char === '"') {
        currentToken += char;
        if (inQuotes) {
          // End of string literal
          // Only push as separate token if we're not inside parentheses, brackets, or angles
          if (parenDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
            tokens.push({
              id: `token-${tokens.length}-${Date.now()}`,
              value: currentToken,
              type: 'literal',
            });
            currentToken = '';
          }
          // Otherwise, keep it as part of the current token
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (inQuotes) {
        currentToken += char;
        continue;
      }

      // Outside quotes, parentheses, brackets, and angles - split on whitespace
      if ((char === ' ' || char === '\t') && parenDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
        if (currentToken) {
          tokens.push({
            id: `token-${tokens.length}-${Date.now()}`,
            value: currentToken,
            type: getTokenType(currentToken, availableRules.map(r => r.name)),
          });
          currentToken = '';
        }
        continue;
      }

      currentToken += char;
    }

    // Add remaining token
    if (currentToken) {
      tokens.push({
        id: `token-${tokens.length}-${Date.now()}`,
        value: currentToken,
        type: getTokenType(currentToken, availableRules.map(r => r.name)),
      });
    }

    return tokens;
  };

  // Check if a string has unclosed quotes, parentheses, brackets, or angle brackets
  const hasUnclosedDelimiters = (str: string): boolean => {
    let inQuotes = false;
    let parenDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;
    let escapeNext = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth--;
        if (char === '<') angleDepth++;
        if (char === '>') angleDepth--;
      }
    }

    return inQuotes || parenDepth !== 0 || bracketDepth !== 0 || angleDepth !== 0;
  };

  // Determine token type
  const getTokenType = (token: string, ruleNames: string[]): ChipType => {
    if (token.startsWith('"') && token.endsWith('"')) return 'literal';
    if (token.match(/^[+*?&~]$/) || token === '|') return 'operator';
    if (ruleNames.includes(token)) return 'rule';
    // Ohm.js built-in rules (with optional quantifiers +, *, ?)
    if (token.match(/^(any|digit|letter|alnum|space|lower|upper|hexDigit|end)[+*?]?$/)) return 'builtin';
    return 'pattern';
  };

  // Convert elements back to string value
  const elementsToValue = (elems: SequenceElement[]): string => {
    return elems.map(e => e.value).join(' ');
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex(e => e.id === active.id);
      const newIndex = elements.findIndex(e => e.id === over.id);

      const newElements = arrayMove(elements, oldIndex, newIndex);
      setElements(newElements);
      onChange(elementsToValue(newElements));
    }
  };

  // Add element
  const addElement = (value: string, type: ChipType) => {
    const newElement: SequenceElement = {
      id: `elem-${Date.now()}-${Math.random()}`,
      value,
      type,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    onChange(elementsToValue(newElements));
  };

  // Remove element
  const removeElement = (id: string) => {
    const newElements = elements.filter(e => e.id !== id);
    setElements(newElements);
    onChange(elementsToValue(newElements));
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(val.length > 0);
    setFocusedSuggestion(0);
  };

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      
      const trimmedValue = inputValue.trim();
      
      // Don't add token if it has unclosed delimiters
      if (hasUnclosedDelimiters(trimmedValue)) {
        return;
      }
      
      if (showSuggestions && filteredSuggestions.length > 0) {
        const suggestion = filteredSuggestions[focusedSuggestion];
        if (suggestion.type === 'create') {
          onCreateRule?.(trimmedValue);
        } else {
          addElement(suggestion.value, suggestion.elementType);
        }
      } else {
        // Add as-is (trimmed)
        const type = getTokenType(trimmedValue, availableRules.map(r => r.name));
        addElement(trimmedValue, type);
      }
      setInputValue('');
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setFocusedSuggestion(prev => 
        Math.min(prev + 1, filteredSuggestions.length - 1)
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setFocusedSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Filter suggestions
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue) return [];

    const suggestions: Array<{
      value: string;
      label: string;
      description: string;
      elementType: ChipType;
      type: 'rule' | 'pattern' | 'builtin' | 'create';
    }> = [];

    const query = inputValue.toLowerCase();

    // Match rules
    availableRules.forEach(rule => {
      if (rule.name.toLowerCase().includes(query)) {
        suggestions.push({
          value: rule.name,
          label: rule.name,
          description: rule.description || 'Rule',
          elementType: 'rule',
          type: 'rule',
        });
      }
    });

    // Ohm.js built-in rules
    const builtinRules = [
      { value: 'any', desc: 'Any single character' },
      { value: 'digit', desc: 'Single digit (0-9)' },
      { value: 'digit+', desc: 'One or more digits' },
      { value: 'letter', desc: 'Single letter (a-z, A-Z)' },
      { value: 'letter+', desc: 'One or more letters' },
      { value: 'alnum+', desc: 'Alphanumeric characters' },
      { value: 'space', desc: 'Single whitespace' },
      { value: 'space*', desc: 'Optional whitespace' },
      { value: 'lower', desc: 'Lowercase letter' },
      { value: 'upper', desc: 'Uppercase letter' },
      { value: 'hexDigit', desc: 'Hex digit (0-9, a-f, A-F)' },
      { value: 'end', desc: 'End of input' },
    ];

    builtinRules.forEach(builtin => {
      if (builtin.value.includes(query) || builtin.desc.toLowerCase().includes(query)) {
        suggestions.push({
          value: builtin.value,
          label: builtin.value,
          description: builtin.desc,
          elementType: 'builtin',
          type: 'builtin',
        });
      }
    });

    // Suggest creating new rule if no exact match
    if (inputValue.match(/^[A-Z][a-zA-Z0-9]*$/) && 
        !availableRules.some(r => r.name === inputValue)) {
      suggestions.push({
        value: inputValue,
        label: `Create rule: ${inputValue}`,
        description: 'Create a new grammar rule',
        elementType: 'rule',
        type: 'create',
      });
    }

    return suggestions.slice(0, 8);
  }, [inputValue, availableRules]);

  return (
    <div className="space-y-3">
      {/* Sequence Builder */}
      <div className="min-h-[60px] p-3 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-950">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={elements.map(e => e.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2 items-center">
              {elements.map((element) => (
                <RuleChip
                  key={element.id}
                  id={element.id}
                  value={element.value}
                  type={element.type}
                  onRemove={() => removeElement(element.id)}
                  draggable
                />
              ))}

              {elements.length === 0 && (
                <div className="text-sm text-muted-foreground italic">
                  Type to add elements, or click suggestions below...
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Type rule name, pattern, or literal..."
          className={`font-mono ${
            inputValue && hasUnclosedDelimiters(inputValue)
              ? 'border-yellow-500 focus-visible:ring-yellow-500'
              : ''
          }`}
        />
        
        {/* Warning for unclosed delimiters */}
        {inputValue && hasUnclosedDelimiters(inputValue) && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            ⚠ Complete the expression (unclosed quotes, parentheses, brackets, or angle brackets)
          </p>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border-2 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
            {filteredSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className={`
                  w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors
                  ${idx === focusedSuggestion ? 'bg-primary/20' : ''}
                  ${idx === 0 ? 'rounded-t-lg' : ''}
                  ${idx === filteredSuggestions.length - 1 ? 'rounded-b-lg' : ''}
                `}
                onClick={() => {
                  if (suggestion.type === 'create') {
                    onCreateRule?.(suggestion.value);
                  } else {
                    addElement(suggestion.value, suggestion.elementType);
                  }
                  setInputValue('');
                  setShowSuggestions(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {suggestion.type === 'create' && (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                  <div className="flex-1">
                    <div className="font-mono text-sm font-semibold">
                      {suggestion.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">Quick add:</span>
        {availableRules.slice(0, 3).map(rule => (
          <StaticRuleChip
            key={rule.name}
            value={rule.name}
            type="rule"
            description={rule.description}
            onClick={() => addElement(rule.name, 'rule')}
          />
        ))}
        {/* Built-in rules */}
        <StaticRuleChip
          value="any"
          type="builtin"
          description="Any single character"
          onClick={() => addElement('any', 'builtin')}
        />
        <StaticRuleChip
          value="digit+"
          type="builtin"
          description="One or more digits"
          onClick={() => addElement('digit+', 'builtin')}
        />
        <StaticRuleChip
          value="letter+"
          type="builtin"
          description="One or more letters"
          onClick={() => addElement('letter+', 'builtin')}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            inputRef.current?.focus();
          }}
          className="h-7 gap-1"
        >
          <Plus className="h-3 w-3" />
          Add More
        </Button>
      </div>
    </div>
  );
};

