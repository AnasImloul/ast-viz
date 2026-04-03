// Grammar analysis utilities for dependency tracking and metadata

export interface RuleDependency {
  from: string;
  to: string;
  type: 'reference' | 'builtin' | 'literal';
}

export interface RuleMetadata {
  name: string;
  usageCount: number;
  isEntry: boolean;
  isTerminal: boolean;
  dependencies: string[];
  dependents: string[];
  complexity: number;
}

export interface GrammarAnalysis {
  rules: string[];
  dependencies: RuleDependency[];
  metadata: Map<string, RuleMetadata>;
  unusedRules: string[];
  entryRule: string | null;
  hasLeftRecursion: boolean;
  leftRecursiveRules: string[];
}

const BUILTIN_RULES = new Set([
  'digit', 'letter', 'alnum', 'space', 'any', 'lower', 'upper',
  'hexDigit', 'listOf', 'nonemptyListOf', 'applySyntactic',
  'end', 'caseInsensitive'
]);

/**
 * Extract rule names from grammar text
 * Matches both uppercase (structural) and lowercase (lexical) rules
 */
export function extractRules(grammarText: string): string[] {
  const rules: string[] = [];
  const lines = grammarText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip comments, empty lines, and grammar name
    if (line.startsWith('//') || !line || line.includes('{') || line === '}') {
      continue;
    }
    
    // Check if next line has '=' to identify rule definition
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    // Match both uppercase (structural) and lowercase (lexical) rule names
    if (nextLine.startsWith('=') && /^[A-Za-z][a-zA-Z0-9_]*$/.test(line)) {
      rules.push(line);
    }
  }
  
  return rules;
}

/**
 * Parse rule alternatives and extract referenced rules
 * Detects both uppercase (structural) and lowercase (lexical) rule references
 * Handles Ohm.js special constructs like listOf<Rule, ",">, Rule<Args>, etc.
 */
function extractReferencesFromDefinition(definition: string, allRules: Set<string>): string[] {
  const references: string[] = [];
  
  // Remove strings (quoted content) - but be careful with escaped quotes
  let cleaned = definition.replace(/"(?:\\.|[^"\\])*"/g, ' ');
  // Remove case labels (-- labelName)
  cleaned = cleaned.replace(/--\s*\w+/g, ' ');
  // Remove curly braces (they're just syntax)
  cleaned = cleaned.replace(/[{}]/g, ' ');
  // Remove operators but keep angle brackets for now
  cleaned = cleaned.replace(/[=|+*?()~&\[\]]/g, ' ');
  
  // Match word tokens that could be rule names (both uppercase and lowercase)
  // This includes tokens inside angle brackets like listOf<Rule, ",">
  const tokens = cleaned.match(/[A-Za-z][a-zA-Z0-9_]*/g) || [];
  
  for (const token of tokens) {
    // Check if token is in our rule set (excluding Ohm.js built-ins)
    if (allRules.has(token) && !BUILTIN_RULES.has(token)) {
      if (!references.includes(token)) {
        references.push(token);
      }
    }
  }
  
  return references;
}

/**
 * Calculate complexity score for a rule
 * Score is based on actual complexity indicators, not simple repetition or basic Ohm constructs
 */
function calculateComplexity(definition: string): number {
  let complexity = 0;
  
  // Remove common Ohm.js patterns that shouldn't count as complexity
  let cleaned = definition;
  
  // Remove listOf/nonemptyListOf constructs - these are simple
  cleaned = cleaned.replace(/nonemptyListOf<[^>]+>/g, '');
  cleaned = cleaned.replace(/listOf<[^>]+>/g, '');
  
  // Remove string literals - they're terminal and simple
  cleaned = cleaned.replace(/"[^"]*"/g, '');
  
  // Remove case labels
  cleaned = cleaned.replace(/--\s*\w+/g, '');
  
  // Count meaningful complexity indicators:
  
  // 1. Alternatives (|) - each choice adds complexity
  const alternatives = (cleaned.match(/\|/g) || []).length;
  complexity += alternatives * 2;
  
  // 2. Optional patterns (?) - but only moderate complexity
  const optionals = (cleaned.match(/\?/g) || []).length;
  complexity += optionals * 0.5;
  
  // 3. Lookahead/lookbehind (~) - these add complexity
  const lookaheads = (cleaned.match(/~/g) || []).length;
  complexity += lookaheads * 1.5;
  
  // 4. Nested parentheses - indicate grouping complexity
  let parenDepth = 0;
  let maxParenDepth = 0;
  for (const char of cleaned) {
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    maxParenDepth = Math.max(maxParenDepth, parenDepth);
  }
  complexity += Math.max(0, maxParenDepth - 1) * 1.5;
  
  // 5. Number of distinct rule references (not total tokens)
  const ruleRefs = cleaned.match(/[A-Z][a-zA-Z0-9_]*/g) || [];
  const uniqueRefs = new Set(ruleRefs).size;
  complexity += uniqueRefs * 0.8;
  
  // 6. Sequence length (but only significantly long sequences)
  const tokens = cleaned.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length > 5) {
    complexity += (tokens.length - 5) * 0.3;
  }
  
  return Math.round(complexity * 10) / 10;
}

/**
 * Detect left recursion in a rule
 */
function hasLeftRecursion(ruleName: string, definition: string): boolean {
  const alternatives = definition.split('|').map(alt => alt.trim());
  
  for (const alt of alternatives) {
    // Remove leading whitespace and check if rule references itself at the start
    const cleaned = alt.trim().replace(/^=\s*/, '');
    const firstToken = cleaned.match(/^[A-Z][a-zA-Z0-9_]*/);
    
    if (firstToken && firstToken[0] === ruleName) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analyze grammar and return comprehensive metadata
 */
export function analyzeGrammar(grammarText: string): GrammarAnalysis {
  if (!grammarText.trim()) {
    return {
      rules: [],
      dependencies: [],
      metadata: new Map(),
      unusedRules: [],
      entryRule: null,
      hasLeftRecursion: false,
      leftRecursiveRules: [],
    };
  }

  const rules = extractRules(grammarText);
  const allRulesSet = new Set(rules);
  const dependencies: RuleDependency[] = [];
  const metadata = new Map<string, RuleMetadata>();
  const usageCount = new Map<string, number>();
  const leftRecursiveRules: string[] = [];

  // Initialize usage counts
  rules.forEach(rule => usageCount.set(rule, 0));

  // Parse each rule and build dependency graph
  const ruleDefinitions = new Map<string, string>();
  const lines = grammarText.split('\n');
  
  let currentRule: string | null = null;
  let currentDefinition: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.includes('{') || line === '}') {
      // But only skip if we're not currently collecting a definition
      if (!currentRule || line.startsWith('//')) {
        continue;
      }
    }

    // Check if this is a rule name (both uppercase and lowercase)
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    const nextNextLine = i < lines.length - 2 ? lines[i + 2].trim() : '';
    
    // Sometimes there's a comment between the rule name and its definition
    // Check both the next line and the line after that
    const hasDefinition = nextLine.startsWith('=') || (nextLine.startsWith('//') && nextNextLine.startsWith('='));
    
    if (hasDefinition && /^[A-Za-z][a-zA-Z0-9_]*$/.test(line)) {
      // Save previous rule
      if (currentRule && currentDefinition.length > 0) {
        ruleDefinitions.set(currentRule, currentDefinition.join(' '));
      }
      currentRule = line;
      currentDefinition = [];
      continue;
    }

    // Collect definition lines
    if (currentRule && (line.startsWith('=') || line.startsWith('|') || line.startsWith('+='))) {
      currentDefinition.push(line);
    }
  }

  // Save last rule
  if (currentRule && currentDefinition.length > 0) {
    ruleDefinitions.set(currentRule, currentDefinition.join(' '));
  }

  // Analyze each rule
  for (const rule of rules) {
    const definition = ruleDefinitions.get(rule) || '';
    const references = extractReferencesFromDefinition(definition, allRulesSet);
    
    // Check for left recursion
    if (hasLeftRecursion(rule, definition)) {
      leftRecursiveRules.push(rule);
    }

    // Update usage counts
    references.forEach(ref => {
      const count = usageCount.get(ref) || 0;
      usageCount.set(ref, count + 1);
    });

    // Add dependencies
    references.forEach(ref => {
      dependencies.push({
        from: rule,
        to: ref,
        type: allRulesSet.has(ref) ? 'reference' : 'builtin',
      });
    });

    // Calculate metadata
    const complexity = calculateComplexity(definition);
    const isTerminal = references.length === 0 || references.every(ref => BUILTIN_RULES.has(ref));
    
    metadata.set(rule, {
      name: rule,
      usageCount: 0, // Will be updated below
      isEntry: false, // Will be determined below
      isTerminal,
      dependencies: references,
      dependents: [],
      complexity,
    });
  }

  // Update usage counts and dependents
  for (const [rule, count] of usageCount.entries()) {
    const meta = metadata.get(rule);
    if (meta) {
      meta.usageCount = count;
    }
  }

  // Build dependents list
  for (const dep of dependencies) {
    const meta = metadata.get(dep.to);
    if (meta && !meta.dependents.includes(dep.from)) {
      meta.dependents.push(dep.from);
    }
  }

  // Determine entry rule (first rule or rule with 0 usage)
  const entryRule = rules.length > 0 ? rules[0] : null;
  if (entryRule) {
    const meta = metadata.get(entryRule);
    if (meta) {
      meta.isEntry = true;
    }
  }

  // Find unused rules
  const unusedRules = rules.filter(rule => {
    const meta = metadata.get(rule);
    return meta && meta.usageCount === 0 && !meta.isEntry;
  });

  return {
    rules,
    dependencies,
    metadata,
    unusedRules,
    entryRule,
    hasLeftRecursion: leftRecursiveRules.length > 0,
    leftRecursiveRules,
  };
}

/**
 * Get suggestions for improving a grammar
 */
export interface GrammarSuggestion {
  type: 'warning' | 'info' | 'error';
  rule?: string;
  message: string;
  fix?: string;
}

export function getGrammarSuggestions(analysis: GrammarAnalysis): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];

  // Unused rules
  if (analysis.unusedRules.length > 0) {
    analysis.unusedRules.forEach(rule => {
      suggestions.push({
        type: 'warning',
        rule,
        message: `Rule "${rule}" is defined but never used`,
        fix: 'Consider removing this rule or referencing it from another rule',
      });
    });
  }

  // Left recursion
  if (analysis.hasLeftRecursion) {
    analysis.leftRecursiveRules.forEach(rule => {
      suggestions.push({
        type: 'info',
        rule,
        message: `Rule "${rule}" has left recursion (intentional for operator precedence)`,
        fix: 'Left recursion is valid in Ohm.js for defining precedence',
      });
    });
  }

  // Complex rules (adjusted threshold for new scoring system)
  analysis.metadata.forEach((meta, rule) => {
    if (meta.complexity > 15) {
      suggestions.push({
        type: 'info',
        rule,
        message: `Rule "${rule}" is complex (score: ${meta.complexity})`,
        fix: 'Consider breaking this rule into smaller sub-rules for clarity',
      });
    }
  });

  // No entry rule
  if (!analysis.entryRule && analysis.rules.length > 0) {
    suggestions.push({
      type: 'warning',
      message: 'No entry rule detected',
      fix: 'The first rule should be your grammar entry point',
    });
  }

  return suggestions;
}

