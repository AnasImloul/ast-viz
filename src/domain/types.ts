// Domain types for the grammar system
// Using branded types for type safety

// Branded type helpers
declare const __brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [__brand]: TBrand };

// Branded types for IDs - provides compile-time type safety
export type RuleId = Brand<string, 'RuleId'>;
export type AlternativeId = Brand<string, 'AlternativeId'>;
export type GrammarName = Brand<string, 'GrammarName'>;

// Type guards and constructors
export const RuleId = (value: string): RuleId => value as RuleId;
export const AlternativeId = (value: string): AlternativeId => value as AlternativeId;
export const GrammarName = (value: string): GrammarName => value as GrammarName;

// Rule operator types
export type RuleOperator = '=' | '+=' | ':=';

// Operator descriptions for UI
export const RULE_OPERATORS: Record<RuleOperator, { label: string; description: string }> = {
  '=': {
    label: 'Define',
    description: 'Define a new rule',
  },
  '+=': {
    label: 'Extend',
    description: 'Add alternatives to an existing rule from a parent grammar',
  },
  ':=': {
    label: 'Override',
    description: 'Replace a rule from the parent grammar',
  },
};

// Alternative value object - fully immutable
export interface Alternative {
  readonly id: AlternativeId;
  readonly value: string;
  readonly label?: string; // Case label (e.g., "plus" from "-- plus")
}

// Rule entity interface - fully immutable
export interface Rule {
  readonly id: RuleId;
  readonly name: string;
  readonly alternatives: readonly Alternative[];
  readonly description?: string;
  readonly operator: RuleOperator;
}

// Grammar entity interface - fully immutable
export interface Grammar {
  readonly name: GrammarName;
  readonly rules: readonly Rule[];
}

// Validation result
export interface ValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

// Parse result for alternatives
export interface ParsedAlternative {
  readonly value: string;
  readonly label?: string;
}


