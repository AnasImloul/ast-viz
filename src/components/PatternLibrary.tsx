import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Hash, Type, Repeat, Star } from 'lucide-react';
import { StaticRuleChip } from './RuleChip';
import Fuse from 'fuse.js';

export interface Pattern {
  label: string;
  description: string;
  value: string;
  category: 'builtin' | 'literal' | 'operator' | 'character';
  example?: string;
}

const patterns: Pattern[] = [
  // Builtin patterns
  { label: 'digit', description: 'Single digit (0-9)', value: 'digit', category: 'builtin', example: '5' },
  { label: 'digit+', description: 'One or more digits', value: 'digit+', category: 'builtin', example: '123' },
  { label: 'letter', description: 'Single letter (a-z, A-Z)', value: 'letter', category: 'builtin', example: 'a' },
  { label: 'letter+', description: 'One or more letters', value: 'letter+', category: 'builtin', example: 'hello' },
  { label: 'alnum', description: 'Alphanumeric character', value: 'alnum', category: 'builtin', example: 'a1' },
  { label: 'alnum+', description: 'One or more alphanumeric', value: 'alnum+', category: 'builtin', example: 'abc123' },
  { label: 'space', description: 'Single whitespace', value: 'space', category: 'builtin', example: ' ' },
  { label: 'space*', description: 'Zero or more spaces', value: 'space*', category: 'builtin', example: '   ' },
  { label: 'space+', description: 'One or more spaces', value: 'space+', category: 'builtin', example: '  ' },
  { label: 'lower', description: 'Lowercase letter', value: 'lower', category: 'builtin', example: 'a' },
  { label: 'upper', description: 'Uppercase letter', value: 'upper', category: 'builtin', example: 'A' },
  { label: 'hexDigit', description: 'Hexadecimal digit (0-9, A-F)', value: 'hexDigit', category: 'builtin', example: 'F' },
  { label: 'any', description: 'Any single character', value: 'any', category: 'builtin', example: 'x' },

  // Character patterns
  { label: '~char', description: 'Any character except char', value: '~', category: 'character', example: '~"a"' },
  { label: '..', description: 'Character range', value: '..', category: 'character', example: '"a".."z"' },
  { label: '\\n', description: 'Newline', value: '"\\n"', category: 'character', example: '\\n' },
  { label: '\\t', description: 'Tab', value: '"\\t"', category: 'character', example: '\\t' },
  { label: '\\r', description: 'Carriage return', value: '"\\r"', category: 'character', example: '\\r' },

  // Literal patterns
  { label: '"text"', description: 'Exact string match', value: '""', category: 'literal', example: '"hello"' },
  { label: '"(" ... ")"', description: 'Parentheses', value: '"(" ")"', category: 'literal', example: '(expr)' },
  { label: '"[" ... "]"', description: 'Square brackets', value: '"[" "]"', category: 'literal', example: '[item]' },
  { label: '"{" ... "}"', description: 'Curly braces', value: '"{" "}"', category: 'literal', example: '{block}' },

  // Operators
  { label: '?', description: 'Optional (zero or one)', value: '?', category: 'operator', example: 'digit?' },
  { label: '*', description: 'Zero or more', value: '*', category: 'operator', example: 'digit*' },
  { label: '+', description: 'One or more', value: '+', category: 'operator', example: 'digit+' },
  { label: '|', description: 'Alternative (or)', value: ' | ', category: 'operator', example: '"+" | "-"' },
  { label: '( )', description: 'Grouping', value: '( )', category: 'operator', example: '(a | b)' },
  { label: '&', description: 'Lookahead (check without consuming)', value: '&', category: 'operator', example: '&letter' },
  { label: '~', description: 'Negative lookahead', value: '~', category: 'operator', example: '~";"' },
];

const categoryInfo = {
  all: { icon: Star, label: 'All Patterns', color: 'text-slate-600' },
  builtin: { icon: Hash, label: 'Built-in', color: 'text-purple-600' },
  literal: { icon: Type, label: 'Literals', color: 'text-green-600' },
  operator: { icon: Repeat, label: 'Operators', color: 'text-orange-600' },
  character: { icon: Type, label: 'Characters', color: 'text-blue-600' },
};

interface PatternLibraryProps {
  onPatternSelect: (pattern: string) => void;
  recentPatterns?: string[];
}

export const PatternLibrary: React.FC<PatternLibraryProps> = ({
  onPatternSelect,
  recentPatterns = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Setup fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(patterns, {
        keys: ['label', 'description', 'value'],
        threshold: 0.3,
      }),
    []
  );

  // Filter patterns based on search and category
  const filteredPatterns = useMemo(() => {
    let results = patterns;

    if (searchQuery) {
      results = fuse.search(searchQuery).map(result => result.item);
    }

    if (activeCategory !== 'all') {
      results = results.filter(p => p.category === activeCategory);
    }

    return results;
  }, [searchQuery, activeCategory, fuse]);

  // Get recent patterns that are valid
  const recentPatternsData = useMemo(() => {
    return recentPatterns
      .slice(0, 5)
      .map(value => patterns.find(p => p.value === value))
      .filter(Boolean) as Pattern[];
  }, [recentPatterns]);

  const getCategoryChipType = (category: string) => {
    switch (category) {
      case 'builtin':
        return 'pattern' as const;
      case 'literal':
        return 'literal' as const;
      case 'operator':
        return 'operator' as const;
      default:
        return 'pattern' as const;
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patterns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Recent Patterns */}
      {recentPatternsData.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Recent</label>
          <div className="flex flex-wrap gap-2">
            {recentPatternsData.map((pattern, idx) => (
              <StaticRuleChip
                key={idx}
                value={pattern.label}
                type={getCategoryChipType(pattern.category)}
                description={pattern.description}
                onClick={() => onPatternSelect(pattern.value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          {Object.entries(categoryInfo).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col gap-1 py-2 data-[state=active]:bg-primary/10"
              >
                <Icon className={`h-4 w-4 ${info.color}`} />
                <span className="text-xs">{info.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <ScrollArea className="h-[300px] mt-3">
          <TabsContent value={activeCategory} className="mt-0">
            <div className="space-y-2">
              {filteredPatterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No patterns found
                </div>
              ) : (
                filteredPatterns.map((pattern, idx) => (
                  <button
                    key={idx}
                    onClick={() => onPatternSelect(pattern.value)}
                    className="w-full text-left p-3 rounded-lg border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="font-mono text-sm font-semibold text-foreground">
                            {pattern.label}
                          </code>
                          {pattern.example && (
                            <span className="text-xs text-muted-foreground">
                              e.g., {pattern.example}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pattern.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-primary">Insert →</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

