import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Target, Circle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { analyzeGrammar, type RuleMetadata } from '@/lib/grammarAnalysis';

interface RuleMinimapProps {
  grammarText: string;
  activeRuleId?: string;
  onRuleClick: (ruleId: string) => void;
}

interface RuleGroup {
  title: string;
  rules: Array<{ name: string; metadata: RuleMetadata }>;
}

export const RuleMinimap: React.FC<RuleMinimapProps> = ({
  grammarText,
  activeRuleId,
  onRuleClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['entry', 'intermediate', 'terminal'])
  );

  const analysis = useMemo(() => analyzeGrammar(grammarText), [grammarText]);

  // Group rules by type
  const ruleGroups = useMemo<RuleGroup[]>(() => {
    const groups: RuleGroup[] = [];

    const entryRules = analysis.rules
      .filter(name => {
        const meta = analysis.metadata.get(name);
        return meta?.isEntry;
      })
      .map(name => ({
        name,
        metadata: analysis.metadata.get(name)!,
      }));

    const intermediateRules = analysis.rules
      .filter(name => {
        const meta = analysis.metadata.get(name);
        return meta && !meta.isEntry && !meta.isTerminal;
      })
      .map(name => ({
        name,
        metadata: analysis.metadata.get(name)!,
      }));

    const terminalRules = analysis.rules
      .filter(name => {
        const meta = analysis.metadata.get(name);
        return meta?.isTerminal && !meta.isEntry;
      })
      .map(name => ({
        name,
        metadata: analysis.metadata.get(name)!,
      }));

    const unusedRules = analysis.unusedRules.map(name => ({
      name,
      metadata: analysis.metadata.get(name)!,
    }));

    if (entryRules.length > 0) {
      groups.push({ title: 'Entry Rules', rules: entryRules });
    }

    if (intermediateRules.length > 0) {
      groups.push({ title: 'Intermediate Rules', rules: intermediateRules });
    }

    if (terminalRules.length > 0) {
      groups.push({ title: 'Terminal Rules', rules: terminalRules });
    }

    if (unusedRules.length > 0) {
      groups.push({ title: 'Unused Rules', rules: unusedRules });
    }

    return groups;
  }, [analysis]);

  // Filter rules based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return ruleGroups;

    const query = searchQuery.toLowerCase();
    return ruleGroups
      .map(group => ({
        ...group,
        rules: group.rules.filter(rule =>
          rule.name.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.rules.length > 0);
  }, [ruleGroups, searchQuery]);

  const toggleGroup = (title: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupColor = (title: string) => {
    if (title.includes('Entry')) return 'text-green-600 dark:text-green-400';
    if (title.includes('Terminal')) return 'text-blue-600 dark:text-blue-400';
    if (title.includes('Unused')) return 'text-orange-600 dark:text-orange-400';
    return 'text-purple-600 dark:text-purple-400';
  };

  const getGroupIcon = (title: string) => {
    if (title.includes('Entry')) return Target;
    if (title.includes('Unused')) return AlertCircle;
    return Circle;
  };

  if (analysis.rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <Circle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No rules yet</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Rules</h3>
          <span className="text-xs text-muted-foreground">
            {analysis.rules.length} total
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Rule Groups */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredGroups.map(group => {
            const isExpanded = expandedGroups.has(group.title);
            const GroupIcon = getGroupIcon(group.title);

            return (
              <div key={group.title}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleGroup(group.title)}
                  className={`
                    w-full justify-start h-8 px-2 font-medium text-xs
                    ${getGroupColor(group.title)}
                  `}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  )}
                  <GroupIcon className="h-3.5 w-3.5 mr-1.5" />
                  {group.title}
                  <span className="ml-auto text-muted-foreground">
                    {group.rules.length}
                  </span>
                </Button>

                {isExpanded && (
                  <div className="ml-2 space-y-0.5 mt-0.5">
                    {group.rules.map(rule => (
                      <Button
                        key={rule.name}
                        variant="ghost"
                        size="sm"
                        onClick={() => onRuleClick(rule.name)}
                        className={`
                          w-full justify-start h-8 px-3 font-mono text-xs
                          ${activeRuleId === rule.name
                            ? 'bg-primary/20 text-primary font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{rule.name}</span>
                          <div className="flex items-center gap-2 text-[10px] ml-2">
                            {rule.metadata.usageCount > 0 && (
                              <span className="opacity-60">
                                ×{rule.metadata.usageCount}
                              </span>
                            )}
                            {rule.metadata.complexity > 5 && (
                              <span className="text-orange-500">●</span>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No rules match your search
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="p-3 border-t space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dependencies:</span>
          <span className="font-mono">{analysis.dependencies.length}</span>
        </div>
        {analysis.hasLeftRecursion && (
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Circle className="h-2.5 w-2.5 fill-current" />
            <span>Left recursion detected</span>
          </div>
        )}
        {analysis.unusedRules.length > 0 && (
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <AlertCircle className="h-2.5 w-2.5" />
            <span>{analysis.unusedRules.length} unused</span>
          </div>
        )}
      </div>
    </div>
  );
};

