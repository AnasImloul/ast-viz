/**
 * Grammar Service
 * Handles grammar validation and Ohm.js integration
 * Simplified version - parsing/serialization moved to grammarParser.ts
 */

import * as ohm from 'ohm-js';
import type { Grammar, ValidationResult } from '@/domain/types';
import { validateGrammar } from '@/domain/grammarUtils';
import { serializeGrammarToText } from '@/domain/grammarParser';
import { ErrorMappingService, type MappedError, type LineMapping } from './ErrorMappingService';

export class GrammarService {
  /**
   * Validate grammar text using Ohm.js
   */
  static validateText(grammarText: string): ValidationResult {
    try {
      ohm.grammar(grammarText);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate grammar domain object
   */
  static validate(grammar: Grammar): ValidationResult {
    // First validate domain structure
    const domainValidation = validateGrammar(grammar);
    if (!domainValidation.valid) {
      return domainValidation;
    }

    // Then validate Ohm.js syntax
    const text = serializeGrammarToText(grammar);
    return this.validateText(text);
  }

  /**
   * Validate grammar with error mapping
   * Returns validation result with mapped errors for the visual builder
   */
  static validateWithMapping(grammar: Grammar): {
    valid: boolean;
    error?: string;
    mappedError?: MappedError;
    mappings?: LineMapping[];
  } {
    const { text, mappings } = ErrorMappingService.serializeWithMappings(grammar.name, [...grammar.rules]);
    
    try {
      ohm.grammar(text);
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const mappedError = ErrorMappingService.mapError(errorMessage, mappings);
      
      return {
        valid: false,
        error: errorMessage,
        mappedError,
        mappings,
      };
    }
  }

  /**
   * Serialize and validate
   */
  static serializeAndValidate(grammar: Grammar): { text: string; validation: ValidationResult } {
    const text = serializeGrammarToText(grammar);
    const validation = this.validateText(text);
    return { text, validation };
  }
}
