/**
 * ErrorMappingService
 * Maps grammar text line numbers to specific rules and alternatives
 * Enables precise error highlighting in the visual builder
 */

import type { Rule, AlternativeId } from '@/domain/types';
import { expandOrAlternatives } from '@/domain/grammarParser';

export interface LineMapping {
  lineNumber: number;
  ruleId: string;
  ruleName: string;
  alternativeId?: string;
  alternativeIndex?: number;
  type: 'rule-declaration' | 'rule-operator' | 'alternative' | 'grammar-name' | 'grammar-close';
}

export interface ErrorLocation {
  line: number;
  column: number;
  context?: string;
}

export interface MappedError {
  originalError: string;
  location: ErrorLocation;
  ruleId?: string;
  ruleName?: string;
  alternativeId?: string;
  alternativeIndex?: number;
  friendlyMessage: string;
  type: 'rule' | 'alternative' | 'grammar' | 'unknown';
}

/**
 * Service for tracking line numbers during grammar serialization
 * and mapping errors back to rules/alternatives
 */
export class ErrorMappingService {
  /**
   * Generate grammar text with line mappings
   * Returns the grammar text and a mapping of line numbers to rules/alternatives
   */
  static serializeWithMappings(grammarName: string, rules: Rule[]): {
    text: string;
    mappings: LineMapping[];
  } {
    const lines: string[] = [];
    const mappings: LineMapping[] = [];
    let currentLine = 1;

    // Grammar name line
    lines.push(`${grammarName} {`);
    mappings.push({
      lineNumber: currentLine++,
      ruleId: '',
      ruleName: grammarName,
      type: 'grammar-name',
    });

    rules.forEach((rule, ruleIndex) => {
      // Empty line before rule (except for first rule)
      if (ruleIndex > 0) {
        lines.push('');
        currentLine++;
      }

      // Comment line
      if (rule.description) {
        lines.push(`  // ${rule.description}`);
        currentLine++;
      }

      // Rule name line
      lines.push(`  ${rule.name}`);
      mappings.push({
        lineNumber: currentLine++,
        ruleId: rule.id,
        ruleName: rule.name,
        type: 'rule-declaration',
      });

      // Expand alternatives containing <OR> back into separate pipe alternatives
      const expandedAlts = expandOrAlternatives(
        rule.alternatives.map(a => ({ value: a.value, label: a.label }))
      );

      expandedAlts.forEach((alt, altIndex) => {
        const trimmedValue = alt.value.trim();
        if (trimmedValue) {
          const altText = alt.label ? `${trimmedValue}  -- ${alt.label}` : trimmedValue;
          // Determine the actual alternative ID from the original alternatives array
          const originalAltIndex = Math.min(altIndex, rule.alternatives.length - 1);
          const alternativeId: AlternativeId | undefined = rule.alternatives[originalAltIndex]?.id;
          
          if (altIndex === 0) {
            const operator = rule.operator || '=';
            lines.push(`    ${operator} ${altText}`);
            mappings.push({
              lineNumber: currentLine++,
              ruleId: rule.id,
              ruleName: rule.name,
              alternativeId,
              alternativeIndex: altIndex,
              type: 'rule-operator',
            });
          } else {
            lines.push(`    | ${altText}`);
            mappings.push({
              lineNumber: currentLine++,
              ruleId: rule.id,
              ruleName: rule.name,
              alternativeId,
              alternativeIndex: altIndex,
              type: 'alternative',
            });
          }
        }
      });
    });

    // Closing brace
    lines.push('}');
    mappings.push({
      lineNumber: currentLine++,
      ruleId: '',
      ruleName: '',
      type: 'grammar-close',
    });

    return {
      text: lines.join('\n'),
      mappings,
    };
  }

  /**
   * Parse Ohm.js error message to extract location information
   */
  static parseOhmError(errorMessage: string): ErrorLocation | null {
    // Ohm.js error format example:
    // "Line 3, col 12:\n  2 | number\n  3 |   = digit{1,2}\n             ^\n  4 | }\nExpected \"}\""
    
    const lineMatch = errorMessage.match(/Line (\d+), col (\d+):/);
    if (!lineMatch) {
      return null;
    }

    const line = parseInt(lineMatch[1], 10);
    const column = parseInt(lineMatch[2], 10);

    // Try to extract the context (the line with the error)
    const contextMatch = errorMessage.match(/\d+\s+\|\s+(.+?)(?:\n|$)/);
    const context = contextMatch ? contextMatch[1].trim() : undefined;

    return { line, column, context };
  }

  /**
   * Map an Ohm.js error to a specific rule/alternative
   */
  static mapError(errorMessage: string, mappings: LineMapping[]): MappedError {
    const location = this.parseOhmError(errorMessage);

    if (!location) {
      return {
        originalError: errorMessage,
        location: { line: 0, column: 0 },
        friendlyMessage: errorMessage,
        type: 'unknown',
      };
    }

    // Find the mapping for this line
    const mapping = mappings.find(m => m.lineNumber === location.line);

    if (!mapping) {
      return {
        originalError: errorMessage,
        location,
        friendlyMessage: this.extractFriendlyMessage(errorMessage),
        type: 'grammar',
      };
    }

    // Create friendly error message
    let friendlyMessage = '';
    let type: 'rule' | 'alternative' | 'grammar' | 'unknown' = 'unknown';

    const baseMessage = this.extractFriendlyMessage(errorMessage);
    const errorContext = this.extractErrorContext(errorMessage);

    if (mapping.type === 'rule-declaration') {
      friendlyMessage = `Error in rule "${mapping.ruleName}": ${baseMessage}`;
      if (errorContext) {
        friendlyMessage += ` (near: ${errorContext})`;
      }
      type = 'rule';
    } else if (mapping.type === 'rule-operator' || mapping.type === 'alternative') {
      const altNum = mapping.alternativeIndex !== undefined ? mapping.alternativeIndex + 1 : 1;
      friendlyMessage = `Error in rule "${mapping.ruleName}", alternative ${altNum}: ${baseMessage}`;
      if (errorContext) {
        friendlyMessage += ` (in: "${errorContext}")`;
      }
      type = 'alternative';
    } else if (mapping.type === 'grammar-name') {
      friendlyMessage = `Error in grammar name: ${baseMessage}`;
      if (errorContext) {
        friendlyMessage += ` (${errorContext})`;
      }
      type = 'grammar';
    } else {
      friendlyMessage = baseMessage;
      if (errorContext) {
        friendlyMessage += ` (context: ${errorContext})`;
      }
      type = 'grammar';
    }

    return {
      originalError: errorMessage,
      location,
      ruleId: mapping.ruleId || undefined,
      ruleName: mapping.ruleName || undefined,
      alternativeId: mapping.alternativeId || undefined,
      alternativeIndex: mapping.alternativeIndex,
      friendlyMessage,
      type,
    };
  }

  /**
   * Extract a user-friendly message from the full Ohm.js error
   */
  private static extractFriendlyMessage(errorMessage: string): string {
    // Check if this is a multi-error format with "Errors:" section
    if (errorMessage.includes('Errors:')) {
      const errorsSection = errorMessage.split('Errors:')[1];
      if (errorsSection) {
        // Extract all error descriptions after the line/col information
        const errorDescriptions: string[] = [];
        const lines = errorsSection.split('\n');
        
        let collectingError = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines and lines with just location info
          if (!line || line.startsWith('-') || line.match(/^\d+\s*\|/) || line.match(/^\^/) || line.match(/^>/)) {
            continue;
          }
          
          // Skip the "Line X, col Y:" header
          if (line.match(/^Line \d+, col \d+:/)) {
            collectingError = true;
            continue;
          }
          
          // This is an actual error description
          if (collectingError && line.length > 0) {
            errorDescriptions.push(line);
            collectingError = false;
          }
        }
        
        // Return all error descriptions joined
        if (errorDescriptions.length > 0) {
          return errorDescriptions.join('; ');
        }
      }
    }
    
    // Try to extract "Expected ..." pattern
    const expectedMatch = errorMessage.match(/Expected (.+?)(?:\n|$)/);
    if (expectedMatch) {
      return `Expected ${expectedMatch[1]}`;
    }
    
    // Try to extract "Rule ... " pattern (common in Ohm.js errors)
    const ruleErrorMatch = errorMessage.match(/Rule .+$/m);
    if (ruleErrorMatch) {
      return ruleErrorMatch[0];
    }

    // If no expected match, try to extract meaningful lines
    const lines = errorMessage.split('\n');
    const meaningfulLines = lines.filter(line => 
      !line.match(/^\s*\d+\s*\|/) && // Not a line number
      !line.match(/^\s*\^/) && // Not a caret indicator
      !line.match(/^Line \d+, col \d+:/) && // Not the location line
      !line.match(/^\s*>/) && // Not the > indicator
      !line.match(/^Errors:/) && // Not the "Errors:" header
      !line.match(/^\s*-\s*Line/) && // Not the "- Line X" marker
      line.trim().length > 0
    );

    // Return the first meaningful line or the full message
    return meaningfulLines.length > 0 ? meaningfulLines[0] : errorMessage;
  }

  /**
   * Get detailed error context from Ohm.js error message
   * Extracts the problematic line content (the line with the caret indicator)
   */
  private static extractErrorContext(errorMessage: string): string | undefined {
    const lines = errorMessage.split('\n');
    
    // Find the line with the caret (^) indicator
    let caretLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().match(/^\^/)) {
        caretLineIndex = i;
        break;
      }
    }
    
    // If we found the caret, get the line before it (the problematic code line)
    if (caretLineIndex > 0) {
      const codeLine = lines[caretLineIndex - 1];
      const match = codeLine.match(/\d+\s*\|\s*(.+)/);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
    
    // Fallback: find any line with code (has pipe)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('|') && !lines[i].includes('Line')) {
        const match = lines[i].match(/\d+\s*\|\s*(.+)/);
        if (match && match[1].trim()) {
          return match[1].trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Check if an error affects a specific rule
   */
  static errorAffectsRule(error: MappedError, ruleId: string): boolean {
    return error.ruleId === ruleId;
  }

  /**
   * Check if an error affects a specific alternative
   */
  static errorAffectsAlternative(error: MappedError, alternativeId: string): boolean {
    return error.alternativeId === alternativeId;
  }

  /**
   * Get all rule IDs affected by errors
   */
  static getAffectedRuleIds(errors: MappedError[]): Set<string> {
    const ruleIds = new Set<string>();
    errors.forEach(error => {
      if (error.ruleId) {
        ruleIds.add(error.ruleId);
      }
    });
    return ruleIds;
  }

  /**
   * Get all alternative IDs affected by errors
   */
  static getAffectedAlternativeIds(errors: MappedError[]): Set<string> {
    const altIds = new Set<string>();
    errors.forEach(error => {
      if (error.alternativeId) {
        altIds.add(error.alternativeId);
      }
    });
    return altIds;
  }
}

