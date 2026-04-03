/**
 * Unified Grammar Parser
 * Consolidates all parsing logic into one coherent module
 * Replaces: ParserService, parts of GrammarService, AlternativeComposer parsing
 */

import * as ohm from 'ohm-js';
import type { Grammar, Rule, Alternative, GrammarName, RuleOperator } from './types';
import { GrammarName as makeGrammarName } from './types';
import { createGrammar, createRule, createAlternative } from './grammarUtils';

// ============================================================================
// Alternative String Parsing
// ============================================================================

export interface ParsedAlternative {
  readonly value: string;
  readonly label?: string;
}

/**
 * Parse alternative string and extract label if present
 * E.g., "Expr + Term  -- plus" => { value: "Expr + Term", label: "plus" }
 */
export function parseAlternativeLabel(alternative: string): ParsedAlternative {
  const trimmed = alternative.trim();
  
  // Look for label pattern: "  -- labelName"
  const labelMatch = trimmed.match(/^(.+?)\s+--\s+(\w+)\s*$/);
  
  if (labelMatch) {
    return {
      value: labelMatch[1].trim(),
      label: labelMatch[2].trim(),
    };
  }

  return {
    value: trimmed,
  };
}

/**
 * Split alternatives by pipe (|) character, respecting quotes and brackets
 */
export function splitAlternatives(str: string): string[] {
  if (!str.trim()) {
    return [];
  }

  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;
  let escapeNext = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    // Handle escape sequences
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

    // Handle quotes
    if ((char === '"' || char === "'") && !escapeNext) {
      current += char;
      if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      }
      continue;
    }

    // Inside quotes, add everything
    if (inQuotes) {
      current += char;
      continue;
    }

    // Track nesting depth
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
    else if (char === '<') angleDepth++;
    else if (char === '>') angleDepth--;

    // Split on pipe only if we're not nested
    if (
      char === '|' &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
    ) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  // Add the last part
  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Parse a rule definition into alternatives
 * Handles pipe-separated alternatives and labels
 */
export function parseRuleDefinition(definition: string): ParsedAlternative[] {
  // Replace <OR> markers with actual pipes for splitting
  const normalized = definition.replace(/<OR>/g, '|');
  
  // Split by pipes
  const parts = splitAlternatives(normalized);
  
  // Parse each part for labels
  return parts
    .filter(part => part.trim().length > 0)
    .map(part => parseAlternativeLabel(part));
}

/**
 * Check if an alternative value is a single token
 * Used for UI optimization (combining single tokens with OR)
 */
export function isSingleToken(value: string): boolean {
  const trimmed = value.trim();

  // Check for literals (quoted strings)
  if (trimmed.match(/^"[^"]*"$/)) return true;
  if (trimmed.match(/^'[^']*'$/)) return true;

  // Check for single pattern or rule with optional modifiers
  if (trimmed.match(/^[~&]?\s*[a-zA-Z_][a-zA-Z0-9_]*[+*?]?$/)) return true;

  return false;
}

/**
 * Combine consecutive single-token alternatives with <OR> separator
 * E.g., ["a", "b", "c"] => ["a <OR> b <OR> c"]
 * But keep complex alternatives separate
 */
export function combineSingleTokenAlternatives(
  alternatives: readonly ParsedAlternative[]
): ParsedAlternative[] {
  if (alternatives.length <= 1) {
    return [...alternatives];
  }

  const result: ParsedAlternative[] = [];
  let currentGroup: string[] = [];

  for (const alt of alternatives) {
    // Skip alternatives with labels (they should stay separate)
    if (alt.label) {
      // Flush current group
      if (currentGroup.length > 0) {
        result.push({
          value: currentGroup.length === 1 
            ? currentGroup[0] 
            : currentGroup.join(' <OR> '),
        });
        currentGroup = [];
      }
      result.push(alt);
      continue;
    }

    if (isSingleToken(alt.value)) {
      currentGroup.push(alt.value);
    } else {
      // Flush current group
      if (currentGroup.length > 0) {
        result.push({
          value: currentGroup.length === 1 
            ? currentGroup[0] 
            : currentGroup.join(' <OR> '),
        });
        currentGroup = [];
      }
      result.push(alt);
    }
  }

  // Flush remaining group
  if (currentGroup.length > 0) {
    result.push({
      value: currentGroup.length === 1 
        ? currentGroup[0] 
        : currentGroup.join(' <OR> '),
    });
  }

  return result;
}

/**
 * Expand alternatives containing <OR> back into separate alternatives
 * Reverse of combineSingleTokenAlternatives
 */
export function expandOrAlternatives(alternatives: readonly ParsedAlternative[]): ParsedAlternative[] {
  const result: ParsedAlternative[] = [];

  for (const alt of alternatives) {
    if (alt.value.includes('<OR>')) {
      // Split by <OR> and create separate alternatives
      const parts = alt.value.split('<OR>').map(p => p.trim()).filter(p => p);
      for (const part of parts) {
        result.push({ value: part, label: alt.label });
      }
    } else {
      result.push(alt);
    }
  }

  return result;
}

// ============================================================================
// Grammar Text Parsing (Ohm.js format -> Domain objects)
// ============================================================================

/**
 * Extract comments from grammar text
 */
function extractComments(grammarText: string): Map<string, string> {
  const commentMap = new Map<string, string>();
  const lines = grammarText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//')) {
      const comment = line.replace('//', '').trim();
      // Look for rule name in next non-empty line
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (!nextLine) continue;
        if (/^[A-Za-z][a-zA-Z0-9_]*$/.test(nextLine)) {
          commentMap.set(nextLine, comment);
        }
        break;
      }
    }
  }

  return commentMap;
}

/**
 * Extract rule body from grammar text
 */
function extractRuleBodyFromText(
  grammarText: string,
  ruleName: string
): { alternatives: ParsedAlternative[]; operator: RuleOperator } | null {
  const lines = grammarText.split('\n');
  let foundRule = false;
  let operator: RuleOperator = '=';
  let ruleBody = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find rule name line
    if (line === ruleName) {
      foundRule = true;
      continue;
    }

    if (!foundRule) continue;

    // Check for operator
    if (line.startsWith('=') || line.startsWith('+=') || line.startsWith(':=')) {
      if (line.startsWith(':=')) {
        operator = ':=';
        ruleBody = line.substring(2).trim();
      } else if (line.startsWith('+=')) {
        operator = '+=';
        ruleBody = line.substring(2).trim();
      } else {
        operator = '=';
        ruleBody = line.substring(1).trim();
      }
      continue;
    }

    // Check for alternative separator (line-based)
    if (line.startsWith('|')) {
      ruleBody += ' | ' + line.substring(1).trim();
      continue;
    }

    // End of rule
    const nextLine = i < lines.length - 1 ? lines[i + 1]?.trim() : '';
    const isNextRuleStart = nextLine && /^[A-Za-z][a-zA-Z0-9_]*$/.test(nextLine) &&
      (i + 2 < lines.length && lines[i + 2]?.trim().match(/^(=|\+=|:=)/));
    
    if (line === '}' || isNextRuleStart) {
      break;
    }

    // Continue building rule body
    if (ruleBody && line && !line.startsWith('//')) {
      ruleBody += ' ' + line;
    } else if (!ruleBody && line && !line.startsWith('//')) {
      ruleBody = line;
    }
  }

  // Parse the rule body
  if (ruleBody) {
    const parsed = parseRuleDefinition(ruleBody);
    
    if (parsed.length === 0) {
      return null;
    }

    // Combine single-token alternatives with OR
    const combined = combineSingleTokenAlternatives(parsed);

    return { alternatives: combined, operator };
  }

  return null;
}

/**
 * Parse Ohm.js grammar text into domain Grammar object
 * This is the main entry point for text -> domain object conversion
 */
export function parseGrammarFromText(grammarText: string): Grammar {
  const defaultGrammar = createGrammar('MyGrammar');

  if (!grammarText.trim()) {
    return defaultGrammar;
  }

  try {
    // Extract grammar name
    const nameMatch = grammarText.match(/^(\w+)\s*\{/);
    const name: GrammarName = nameMatch ? makeGrammarName(nameMatch[1]) : makeGrammarName('MyGrammar');

    // Try to use Ohm.js for robust parsing
    try {
      const ohmGrammar = ohm.grammar(grammarText);
      const rules = extractRulesFromOhm(grammarText, name, ohmGrammar);

      if (rules.length > 0) {
        return { name, rules };
      }
    } catch {
      // Fallback parsing will be used
    }

    // Fallback: regex-based parsing
    return parseWithFallback(grammarText, name);
  } catch {
    // Return default grammar on error
    return defaultGrammar;
  }
}

/**
 * Extract rules from Ohm.js grammar object
 */
function extractRulesFromOhm(
  grammarText: string,
  grammarName: GrammarName,
  ohmGrammar: ohm.Grammar
): readonly Rule[] {
  const rules: Rule[] = [];

  // Extract comments for descriptions
  const commentMap = extractComments(grammarText);

  // Get rule names from Ohm grammar
  const ruleNames = Object.keys(ohmGrammar.rules);

  for (const ruleName of ruleNames) {
    // Skip Ohm.js internal rules
    if (ruleName.startsWith('_')) continue;

    const description = commentMap.get(ruleName);
    const ruleBody = extractRuleBodyFromText(grammarText, ruleName);

    if (ruleBody) {
      const alternatives: Alternative[] = ruleBody.alternatives.map((alt, idx) =>
        createAlternative(grammarName, ruleName, idx, alt.value, alt.label)
      );

      const rule = createRule(grammarName, ruleName, alternatives, {
        description,
        operator: ruleBody.operator,
      });

      rules.push(rule);
    }
  }

  return rules;
}

/**
 * Fallback regex-based parser
 */
function parseWithFallback(grammarText: string, grammarName: GrammarName): Grammar {
  const rulesSection = grammarText.match(/\{([\s\S]*)\}/);
  if (!rulesSection) {
    return createGrammar(grammarName);
  }

  const rulesText = rulesSection[1];
  const lines = rulesText.split('\n').filter(line => line.trim());

  const rules: Rule[] = [];
  let currentRuleName: string | null = null;
  let currentDefinition: string[] = [];
  let lastComment = '';
  let currentOperator: RuleOperator = '=';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('//')) {
      lastComment = trimmed.replace('//', '').trim();
      continue;
    }

    // Check if this is a rule name
    const ruleMatch = trimmed.match(/^(\w+)\s*$/);
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    
    if (ruleMatch && nextLine && nextLine.includes('=')) {
      // Save previous rule
      if (currentRuleName) {
        addParsedRule(rules, grammarName, currentRuleName, currentDefinition, lastComment, currentOperator);
        lastComment = '';
      }

      currentRuleName = ruleMatch[1];
      currentDefinition = [];
      currentOperator = '=';
      continue;
    }

    // Parse operator and definition
    if (trimmed.startsWith(':=')) {
      currentOperator = ':=';
      const def = trimmed.substring(2).trim();
      if (!def.startsWith('//')) currentDefinition.push(def);
    } else if (trimmed.startsWith('+=')) {
      currentOperator = '+=';
      const def = trimmed.substring(2).trim();
      if (!def.startsWith('//')) currentDefinition.push(def);
    } else if (trimmed.startsWith('=')) {
      currentOperator = '=';
      const def = trimmed.substring(1).trim();
      if (!def.startsWith('//')) currentDefinition.push(def);
    } else if (trimmed.startsWith('|')) {
      const def = trimmed.substring(1).trim();
      if (!def.startsWith('//')) {
        currentDefinition.push('|');
        currentDefinition.push(def);
      }
    } else if (currentRuleName && !trimmed.startsWith('//')) {
      if (trimmed) currentDefinition.push(trimmed);
    }
  }

  // Save last rule
  if (currentRuleName) {
    addParsedRule(rules, grammarName, currentRuleName, currentDefinition, lastComment, currentOperator);
  }

  return {
    name: grammarName,
    rules: rules.length > 0 ? rules : [createRule(grammarName, 'Expr')],
  };
}

/**
 * Helper to add parsed rule
 */
function addParsedRule(
  rules: Rule[],
  grammarName: GrammarName,
  ruleName: string,
  definition: string[],
  comment: string,
  operator: RuleOperator
): void {
  const fullDef = definition.join(' ').trim();
  const parsed = parseRuleDefinition(fullDef);

  const alternatives = parsed.length > 0
    ? parsed.map((alt, idx) =>
        createAlternative(grammarName, ruleName, idx, alt.value, alt.label)
      )
    : [createAlternative(grammarName, ruleName, 0, '')];

  const rule = createRule(grammarName, ruleName, alternatives, {
    description: comment,
    operator,
  });

  rules.push(rule);
}

// ============================================================================
// Grammar Serialization (Domain objects -> Ohm.js text)
// ============================================================================

/**
 * Serialize Grammar domain object to Ohm.js grammar text
 * This is the main entry point for domain object -> text conversion
 */
export function serializeGrammarToText(grammar: Grammar): string {
  const lines: string[] = [`${grammar.name} {`];

  grammar.rules.forEach((rule, index) => {
    if (index > 0) {
      lines.push('');
    }

    if (rule.description) {
      lines.push(`  // ${rule.description}`);
    }

    lines.push(`  ${rule.name}`);

    // Expand alternatives containing <OR> back into separate pipe alternatives
    const expandedAlts = expandOrAlternatives(rule.alternatives);

    expandedAlts.forEach((alt, altIndex) => {
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

  return lines.join('\n');
}

