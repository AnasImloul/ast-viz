/**
 * Grammar domain utilities
 * Pure functions for grammar manipulation (replacing anemic entity classes)
 */

import type { Grammar, Rule, Alternative, RuleId, AlternativeId, GrammarName, RuleOperator, ValidationResult } from './types';
import { RuleId as makeRuleId, AlternativeId as makeAlternativeId, GrammarName as makeGrammarName } from './types';

// ============================================================================
// ID Generation (inline, no separate service needed)
// ============================================================================

export function generateRuleId(grammarName: GrammarName, ruleName: string): RuleId {
  return makeRuleId(`rule-${grammarName}-${ruleName}`);
}

export function generateAlternativeId(grammarName: GrammarName, ruleName: string, index: number): AlternativeId {
  return makeAlternativeId(`alt-${grammarName}-${ruleName}-${index}`);
}

export function generateTempAlternativeId(index: number): AlternativeId {
  return makeAlternativeId(`temp-alt-${index}-${Date.now()}`);
}

export function generateUniqueRuleName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let counter = 2;
  while (existingNames.includes(`${baseName}${counter}`)) {
    counter++;
  }

  return `${baseName}${counter}`;
}

// ============================================================================
// Alternative Utilities
// ============================================================================

export function createAlternative(
  grammarName: GrammarName,
  ruleName: string,
  index: number,
  value: string = '',
  label?: string
): Alternative {
  return {
    id: generateAlternativeId(grammarName, ruleName, index),
    value,
    label,
  };
}

// ============================================================================
// Rule Utilities
// ============================================================================

export function createRule(
  grammarName: GrammarName,
  name: string,
  alternatives: readonly Alternative[] = [],
  options: {
    description?: string;
    operator?: RuleOperator;
  } = {}
): Rule {
  const id = generateRuleId(grammarName, name);

  // If no alternatives provided, create one empty alternative
  const alts = alternatives.length > 0
    ? alternatives
    : [createAlternative(grammarName, name, 0)];

  return {
    id,
    name,
    alternatives: alts,
    description: options.description,
    operator: options.operator || '=',
  };
}

export function updateRule(rule: Rule, updates: Partial<Omit<Rule, 'id'>>): Rule {
  return { ...rule, ...updates };
}

export function addAlternativeToRule(
  rule: Rule,
  grammarName: GrammarName,
  value: string = '',
  label?: string
): Rule {
  const newAlt = createAlternative(
    grammarName,
    rule.name,
    rule.alternatives.length,
    value,
    label
  );

  return {
    ...rule,
    alternatives: [...rule.alternatives, newAlt],
  };
}

export function removeAlternativeFromRule(rule: Rule, alternativeId: AlternativeId): Rule {
  // Don't allow removing the last alternative
  if (rule.alternatives.length === 1) {
    return rule;
  }

  return {
    ...rule,
    alternatives: rule.alternatives.filter(alt => alt.id !== alternativeId),
  };
}

export function updateAlternativeInRule(
  rule: Rule,
  alternativeId: AlternativeId,
  updates: Partial<Omit<Alternative, 'id'>>
): Rule {
  return {
    ...rule,
    alternatives: rule.alternatives.map(alt =>
      alt.id === alternativeId ? { ...alt, ...updates } : alt
    ),
  };
}

export function duplicateRule(
  rule: Rule,
  grammarName: GrammarName,
  newName: string
): Rule {
  const newId = generateRuleId(grammarName, newName);

  // Re-generate IDs for alternatives
  const newAlternatives = rule.alternatives.map((alt, idx) => ({
    id: generateAlternativeId(grammarName, newName, idx),
    value: alt.value,
    label: alt.label,
  }));

  return {
    id: newId,
    name: newName,
    alternatives: newAlternatives,
    description: rule.description,
    operator: rule.operator,
  };
}

export function isStructuralRule(rule: Rule): boolean {
  return /^[A-Z]/.test(rule.name);
}

export function isLexicalRule(rule: Rule): boolean {
  return /^[a-z]/.test(rule.name);
}

export function validateRuleName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return {
      valid: false,
      error: 'Rule name cannot be empty',
    };
  }

  if (!/^[A-Za-z][a-zA-Z0-9_]*$/.test(name)) {
    return {
      valid: false,
      error: 'Rule name must start with a letter and contain only letters, digits, and underscores',
    };
  }

  return { valid: true };
}

export function validateRule(rule: Rule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate name
  const nameValidation = validateRuleName(rule.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error!);
  }

  // Validate alternatives
  if (rule.alternatives.length === 0) {
    errors.push('Rule must have at least one alternative');
  }

  // Check for all-empty alternatives
  const hasNonEmpty = rule.alternatives.some(alt => alt.value.trim().length > 0);
  if (!hasNonEmpty) {
    errors.push('At least one alternative must have a value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Grammar Utilities
// ============================================================================

export function createGrammar(name: string, rules: readonly Rule[] = []): Grammar {
  const grammarName = makeGrammarName(name);

  // If no rules provided, create a default rule
  const initialRules = rules.length > 0
    ? rules
    : [createRule(grammarName, 'Expr', [], { description: 'Main expression' })];

  return {
    name: grammarName,
    rules: initialRules,
  };
}

export function updateGrammarName(grammar: Grammar, newName: string): Grammar {
  const newGrammarName = makeGrammarName(newName);

  // Need to regenerate all IDs since they depend on grammar name
  const updatedRules = grammar.rules.map(rule => {
    const newRuleId = generateRuleId(newGrammarName, rule.name);
    const newAlternatives = rule.alternatives.map((alt, idx) => ({
      id: generateAlternativeId(newGrammarName, rule.name, idx),
      value: alt.value,
      label: alt.label,
    }));

    return {
      ...rule,
      id: newRuleId,
      alternatives: newAlternatives,
    };
  });

  return {
    name: newGrammarName,
    rules: updatedRules,
  };
}

export function addRuleToGrammar(grammar: Grammar, rule: Rule): Grammar {
  return {
    ...grammar,
    rules: [...grammar.rules, rule],
  };
}

export function removeRuleFromGrammar(grammar: Grammar, ruleId: RuleId): Grammar {
  // Don't allow removing the last rule
  if (grammar.rules.length === 1) {
    return grammar;
  }

  return {
    ...grammar,
    rules: grammar.rules.filter(r => r.id !== ruleId),
  };
}

export function updateRuleInGrammar(
  grammar: Grammar,
  ruleId: RuleId,
  updates: Partial<Omit<Rule, 'id'>>
): Grammar {
  return {
    ...grammar,
    rules: grammar.rules.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    ),
  };
}

export function reorderRules(grammar: Grammar, oldIndex: number, newIndex: number): Grammar {
  const rules = [...grammar.rules];
  const [removed] = rules.splice(oldIndex, 1);
  rules.splice(newIndex, 0, removed);

  return {
    ...grammar,
    rules,
  };
}

export function findRuleById(grammar: Grammar, ruleId: RuleId): Rule | undefined {
  return grammar.rules.find(r => r.id === ruleId);
}

export function findRuleByName(grammar: Grammar, name: string): Rule | undefined {
  return grammar.rules.find(r => r.name === name);
}

export function getRuleNames(grammar: Grammar): string[] {
  return grammar.rules.map(r => r.name);
}

export function hasRuleName(grammar: Grammar, name: string): boolean {
  return grammar.rules.some(r => r.name === name);
}

export function duplicateRuleInGrammar(grammar: Grammar, ruleId: RuleId): Grammar {
  const rule = findRuleById(grammar, ruleId);
  if (!rule) {
    return grammar;
  }

  // Generate unique name
  const existingNames = getRuleNames(grammar);
  const newName = generateUniqueRuleName(rule.name, existingNames);

  // Create duplicated rule
  const duplicated = duplicateRule(rule, grammar.name, newName);

  // Insert after the original rule
  const originalIndex = grammar.rules.findIndex(r => r.id === ruleId);
  const newRules = [...grammar.rules];
  newRules.splice(originalIndex + 1, 0, duplicated);

  return {
    ...grammar,
    rules: newRules,
  };
}

export function combineRulesAsOr(
  grammar: Grammar,
  ruleIds: readonly RuleId[],
  newRuleName: string
): Grammar {
  if (ruleIds.length === 0) {
    return grammar;
  }

  const rulesToCombine = ruleIds
    .map(id => findRuleById(grammar, id))
    .filter((r): r is Rule => r !== undefined);

  if (rulesToCombine.length === 0) {
    return grammar;
  }

  // Create alternatives that reference each rule by name
  const alternatives = rulesToCombine.map((rule, idx) =>
    createAlternative(
      grammar.name,
      newRuleName,
      idx,
      rule.name
    )
  );

  const combinedRule = createRule(
    grammar.name,
    newRuleName,
    alternatives,
    {
      description: `Combined from: ${rulesToCombine.map(r => r.name).join(', ')}`,
      operator: '=',
    }
  );

  return addRuleToGrammar(grammar, combinedRule);
}

export function getStructuralRules(grammar: Grammar): readonly Rule[] {
  return grammar.rules.filter(isStructuralRule);
}

export function getLexicalRules(grammar: Grammar): readonly Rule[] {
  return grammar.rules.filter(isLexicalRule);
}

export function validateGrammar(grammar: Grammar): ValidationResult {
  const errors: string[] = [];

  // Validate grammar name
  if (!grammar.name.trim()) {
    errors.push('Grammar name cannot be empty');
  }

  if (!/^[A-Z][a-zA-Z0-9_]*$/.test(grammar.name)) {
    errors.push('Grammar name must start with an uppercase letter');
  }

  // Validate rules
  if (grammar.rules.length === 0) {
    errors.push('Grammar must have at least one rule');
  }

  // Validate each rule
  for (const rule of grammar.rules) {
    const ruleValidation = validateRule(rule);
    if (!ruleValidation.valid) {
      errors.push(`Rule "${rule.name}": ${ruleValidation.errors.join(', ')}`);
    }
  }

  // Check for duplicate rule names
  const ruleNames = getRuleNames(grammar);
  const duplicates = ruleNames.filter(
    (name, index) => ruleNames.indexOf(name) !== index
  );
  if (duplicates.length > 0) {
    errors.push(`Duplicate rule names: ${[...new Set(duplicates)].join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}



