import * as ohm from 'ohm-js';
import type { ASTNode, ParseResult } from '@/types/ast';

/**
 * Parse input text using the given Ohm.js grammar
 */
export function parseWithGrammar(
  grammarText: string,
  inputText: string,
  startRule?: string
): ParseResult {
  try {
    // Create grammar from text
    const grammar = ohm.grammar(grammarText);
    
    // Parse input
    const matchResult = startRule 
      ? grammar.match(inputText, startRule)
      : grammar.match(inputText);

    if (matchResult.failed()) {
      return {
        success: false,
        error: matchResult.message,
      };
    }

    // Create a semantics to traverse the CST
    const semantics = grammar.createSemantics();
    
    // Helper to check if a rule should be collapsed into a single token
    // Follow Ohm.js convention: lowercase rule names are lexical (terminals)
    const isLexicalRule = (ctorName: string): boolean => {
      // Ignore Ohm.js internal rules (starting with _)
      if (ctorName.startsWith('_')) {
        return false;
      }
      
      // Ignore Ohm.js built-in parameterized rules (part of the framework)
      // These are lowercase but structural, not lexical tokens
      const ohmBuiltInRules = [
        'listOf', 'nonemptyListOf', 'emptyListOf',
        'listOfWithSeparator', 'applySyntactic'
      ];
      if (ohmBuiltInRules.includes(ctorName)) {
        return false;
      }
      
      // Check if the rule name starts with a lowercase letter
      // This is the Ohm.js convention for lexical rules
      return /^[a-z]/.test(ctorName);
    };
    
    // Helper to flatten children, unwrapping Ohm.js internal nodes
    const flattenChildren = (childNodes: ASTNode[]): ASTNode[] => {
      const result: ASTNode[] = [];
      
      for (const child of childNodes) {
        // These are Ohm.js framework nodes, not user-defined rules
        if (child.name === '_iter') {
          // Unwrap _iter nodes (repetition containers) - add their children directly
          result.push(...flattenChildren(child.children));
        } else if (child.name === '_terminal') {
          // Skip _terminal nodes (literal punctuation from grammar definitions)
          continue;
        } else {
          result.push(child);
        }
      }
      
      // Filter out lexical separator nodes (lowercase) that appear alongside structural nodes (uppercase)
      // Common pattern: Row (nl Row)* where nl is just a separator
      const hasStructuralNodes = result.some(child => /^[A-Z]/.test(child.name));
      if (hasStructuralNodes) {
        return result.filter(child => {
          // Keep structural nodes (uppercase) and their content
          // Filter out lexical nodes (lowercase) that are just separators
          return /^[A-Z]/.test(child.name) || child.children.length > 0;
        });
      }
      
      return result;
    };
    
    // Add an operation to convert to our AST format
    semantics.addOperation('toAST', {
      _nonterminal(...children: any[]): ASTNode {
        const ctorName = this.ctorName;
        
        // If this is a lexical/token rule, collapse it to a leaf node
        if (isLexicalRule(ctorName)) {
          return {
            name: ctorName,
            children: [],
            value: this.sourceString && this.sourceString.length < 100 ? this.sourceString : undefined,
            interval: this.source ? {
              startIdx: this.source.startIdx,
              endIdx: this.source.endIdx,
            } : undefined,
          };
        }
        
        // For structural rules, process children normally
        const childNodes = children.map((child: any) => child.toAST());
        
        // Flatten children - unwrap _iter nodes and filter out _terminal
        const flattenedChildren = flattenChildren(childNodes);
        
        return {
          name: ctorName,
          children: flattenedChildren,
          value: this.sourceString && this.sourceString.length < 100 ? this.sourceString : undefined,
          interval: this.source ? {
            startIdx: this.source.startIdx,
            endIdx: this.source.endIdx,
          } : undefined,
        };
      },
      _terminal(): ASTNode {
        return {
          name: this.ctorName,
          children: [],
          value: this.sourceString,
          interval: this.source ? {
            startIdx: this.source.startIdx,
            endIdx: this.source.endIdx,
          } : undefined,
        };
      },
      _iter(...children: any[]): ASTNode {
        return {
          name: this.ctorName,
          children: children.map((child: any) => child.toAST()),
          value: this.sourceString && this.sourceString.length < 100 ? this.sourceString : undefined,
          interval: this.source ? {
            startIdx: this.source.startIdx,
            endIdx: this.source.endIdx,
          } : undefined,
        };
      },
    });

    // Convert to AST using semantics
    const ast: ASTNode = semantics(matchResult).toAST();

    return {
      success: true,
      ast,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get default start rule from grammar
 */
export function getDefaultStartRule(grammarText: string): string | null {
  try {
    const grammar = ohm.grammar(grammarText);
    // Get the first rule name if available
    const rules = Object.keys(grammar.rules || {});
    return rules.length > 0 ? rules[0] : null;
  } catch {
    return null;
  }
}

/**
 * Validate grammar syntax
 */
export function validateGrammar(grammarText: string): { valid: boolean; error?: string } {
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

