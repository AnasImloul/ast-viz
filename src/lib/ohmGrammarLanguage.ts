/**
 * CodeMirror Language Support for Ohm.js Grammars
 * 
 * Provides:
 * - Syntax highlighting
 * - Autocomplete
 * - Linting/Diagnostics
 * - Hover information
 * - Code folding for rules
 */

import { LanguageSupport, StreamLanguage, foldService } from '@codemirror/language';
import { CompletionContext, autocompletion, type Completion, type CompletionResult } from '@codemirror/autocomplete';
import { linter, type Diagnostic } from '@codemirror/lint';
import { hoverTooltip } from '@codemirror/view';
import type { EditorState } from '@codemirror/state';
import * as ohm from 'ohm-js';

// ============================================================================
// Syntax Highlighting - Simple Stream Parser
// ============================================================================

const ohmGrammarLanguage = StreamLanguage.define({
  name: 'ohm',
  startState: () => ({ inRule: false, inComment: false }),
  token: (stream, _state) => {
    // Handle comments
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Handle strings
    if (stream.match(/^"([^"\\]|\\.)*"/)) return 'string';
    if (stream.match(/^'([^'\\]|\\.)*'/)) return 'string';

    // Handle operators
    if (stream.match(':=')) return 'operator';
    if (stream.match('+=')) return 'operator';
    if (stream.match('=')) return 'operator';
    if (stream.match('|')) return 'operator';
    if (stream.match(/[*+?~&]/)) return 'operator';

    // Handle rule names (before = or := or +=)
    if (stream.match(/^[A-Z][a-zA-Z0-9_]*/)) return 'keyword';
    if (stream.match(/^[a-z][a-zA-Z0-9_]*/)) return 'variable';

    // Handle brackets and parens
    if (stream.match(/[{}()\[\]]/)) return 'bracket';

    // Handle labels (after --)
    if (stream.match(/--\s*\w+/)) return 'meta';

    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: '//' },
  },
});

// ============================================================================
// Autocomplete
// ============================================================================

interface OhmGrammarContext {
  grammarName: string | null;
  rules: string[];
}

function parseGrammarContext(doc: string): OhmGrammarContext {
  const rules: string[] = [];
  let grammarName: string | null = null;

  // Extract grammar name
  const nameMatch = doc.match(/^(\w+)\s*\{/);
  if (nameMatch) {
    grammarName = nameMatch[1];
  }

  // Extract rule names (both structural and lexical)
  const ruleMatches = doc.matchAll(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|\+=|:=)/gm);
  for (const match of ruleMatches) {
    rules.push(match[1]);
  }

  return { grammarName, rules };
}

function getOhmCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const doc = context.state.doc.toString();
  const { rules } = parseGrammarContext(doc);

  const completions: Completion[] = [];

  // Rule references
  rules.forEach(rule => {
    completions.push({
      label: rule,
      type: 'variable',
      info: `Reference to rule: ${rule}`,
    });
  });

  // Ohm.js operators
  completions.push(
    { label: '*', type: 'keyword', info: 'Zero or more (Kleene star)', detail: 'operator' },
    { label: '+', type: 'keyword', info: 'One or more', detail: 'operator' },
    { label: '?', type: 'keyword', info: 'Optional (zero or one)', detail: 'operator' },
    { label: '~', type: 'keyword', info: 'Lexification (case-insensitive)', detail: 'operator' },
    { label: '&', type: 'keyword', info: 'Lookahead (check without consuming)', detail: 'operator' },
    { label: '|', type: 'keyword', info: 'Alternation (or)', detail: 'operator' },
  );

  // Common patterns
  completions.push(
    { label: 'letter', type: 'constant', info: 'Built-in: Any letter character' },
    { label: 'digit', type: 'constant', info: 'Built-in: Any digit 0-9' },
    { label: 'alnum', type: 'constant', info: 'Built-in: Any alphanumeric character' },
    { label: 'space', type: 'constant', info: 'Built-in: Any whitespace character' },
    { label: 'any', type: 'constant', info: 'Built-in: Any single character' },
    { label: 'end', type: 'constant', info: 'Built-in: End of input' },
    { label: 'caseInsensitive', type: 'function', info: 'Built-in: Case-insensitive string matching' },
  );

  // Snippets for common patterns
  completions.push(
    { 
      label: 'rule', 
      type: 'keyword', 
      apply: 'RuleName\n  = ',
      info: 'Create a new syntactic rule (starts with uppercase)',
      detail: 'snippet'
    },
    { 
      label: 'lexicalRule', 
      type: 'keyword', 
      apply: 'ruleName\n  = ',
      info: 'Create a new lexical rule (starts with lowercase)',
      detail: 'snippet'
    },
    {
      label: 'alternative',
      type: 'keyword',
      apply: '| ',
      info: 'Add an alternative to current rule',
      detail: 'snippet'
    },
    {
      label: 'labeled',
      type: 'keyword',
      apply: '-- label',
      info: 'Add a label to an alternative',
      detail: 'snippet'
    },
  );

  // Keywords
  completions.push(
    { label: 'listOf', type: 'function', info: 'Built-in: Comma-separated list helper', detail: 'function' },
    { label: 'NonemptyListOf', type: 'function', info: 'Built-in: Non-empty comma-separated list', detail: 'function' },
    { label: 'applySyntactic', type: 'function', info: 'Built-in: Apply rule syntactically', detail: 'function' },
  );

  return {
    from: word.from,
    options: completions,
  };
}

// ============================================================================
// Linting/Diagnostics
// ============================================================================

function createOhmLinter() {
  return linter((view) => {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc.toString();

    if (!doc.trim()) {
      return diagnostics;
    }

    try {
      // Try to parse with Ohm.js
      ohm.grammar(doc);
    } catch (error: unknown) {
      // Parse error
      const errorMessage = error instanceof Error ? error.message : 'Unknown grammar error';
      
      // Try to extract line/column information from error message
      const lineMatch = errorMessage.match(/Line (\d+), col (\d+):/);
      
      if (lineMatch) {
        const line = parseInt(lineMatch[1]) - 1;
        const col = parseInt(lineMatch[2]) - 1;
        
        const lineObj = view.state.doc.line(Math.max(1, Math.min(line + 1, view.state.doc.lines)));
        const from = lineObj.from + col;
        const to = Math.min(lineObj.to, from + 20); // Highlight up to 20 chars
        
        diagnostics.push({
          from,
          to,
          severity: 'error',
          message: errorMessage,
        });
      } else {
        // Generic error at start of document
        diagnostics.push({
          from: 0,
          to: Math.min(doc.length, 50),
          severity: 'error',
          message: errorMessage,
        });
      }
    }

    // Additional linting rules
    const { rules, grammarName } = parseGrammarContext(doc);
    
    // Check for undefined rule references
    const ruleRefs = doc.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g);
    for (const match of ruleRefs) {
      const ref = match[1];
      const pos = match.index || 0;
      
      // Skip the grammar name itself
      if (grammarName && ref === grammarName) {
        continue;
      }
      
      // Skip if this is a label (after --)
      const beforeRef = doc.substring(Math.max(0, pos - 10), pos);
      if (beforeRef.includes('--')) {
        continue;
      }
      
      // Skip if inside a comment
      const lineStart = doc.lastIndexOf('\n', pos);
      const lineContent = doc.substring(lineStart + 1, pos + ref.length);
      if (lineContent.includes('//')) {
        continue;
      }
      
      // Skip built-in rules and defined rules
      const builtins = ['letter', 'digit', 'alnum', 'space', 'any', 'end', 'listOf', 'NonemptyListOf', 'caseInsensitive', 'applySyntactic'];
      if (!builtins.includes(ref) && !rules.includes(ref)) {
        // Check if this looks like it could be a rule reference (not a keyword or operator)
        const nextChar = doc[pos + ref.length];
        const prevChar = doc[pos - 1];
        
        // Skip if it's part of a rule definition (followed by = or := or +=)
        if (nextChar === '=' || (nextChar === '+' && doc[pos + ref.length + 1] === '=') || (nextChar === ':' && doc[pos + ref.length + 1] === '=')) {
          continue;
        }
        
        // Skip if it's at the beginning of the grammar (likely the grammar name)
        const beforePos = doc.substring(0, pos).trim();
        if (!beforePos || beforePos.endsWith('{')) {
          continue;
        }
        
        // Only warn if it looks like it's in a rule body context
        // (preceded by whitespace or operators, not special characters)
        if (prevChar && /[\s=|()[\]{}+*?~&]/.test(prevChar)) {
          // Could be an undefined reference - but only warn, not error
          diagnostics.push({
            from: pos,
            to: pos + ref.length,
            severity: 'warning',
            message: `Undefined rule: ${ref}`,
          });
        }
      }
    }

    return diagnostics;
  });
}

// ============================================================================
// Hover Tooltips
// ============================================================================

function createOhmHover() {
  return hoverTooltip((view, pos) => {
    const doc = view.state.doc.toString();
    const { rules } = parseGrammarContext(doc);
    
    // Get word at cursor
    const word = view.state.wordAt(pos);
    if (!word) return null;
    
    const text = doc.slice(word.from, word.to);
    
    // Check if it's a defined rule
    if (rules.includes(text)) {
      return {
        pos: word.from,
        end: word.to,
        above: true,
        create() {
          const dom = document.createElement('div');
          dom.className = 'cm-tooltip-hover';
          dom.textContent = `Rule: ${text}`;
          return { dom };
        },
      };
    }
    
    // Check for built-in rules
    const builtinInfo: Record<string, string> = {
      'letter': 'Matches any letter character (a-z, A-Z)',
      'digit': 'Matches any digit (0-9)',
      'alnum': 'Matches any alphanumeric character',
      'space': 'Matches any whitespace character',
      'any': 'Matches any single character',
      'end': 'Matches the end of input',
      'listOf': 'Built-in helper for comma-separated lists',
      'NonemptyListOf': 'Built-in helper for non-empty comma-separated lists',
      'caseInsensitive': 'Makes string matching case-insensitive',
    };
    
    if (builtinInfo[text]) {
      return {
        pos: word.from,
        end: word.to,
        above: true,
        create() {
          const dom = document.createElement('div');
          dom.className = 'cm-tooltip-hover';
          dom.textContent = builtinInfo[text];
          return { dom };
        },
      };
    }
    
    return null;
  });
}

// ============================================================================
// Code Folding for Ohm Grammar Rules
// ============================================================================

/**
 * Creates a fold service for Ohm grammar rules.
 * 
 * Supports folding:
 * - Individual grammar rules (e.g., ruleName = ... )
 * - Grammar blocks (GrammarName { ... })
 * - Multi-line rule alternatives
 */
function createOhmFoldService() {
  return foldService.of((state: EditorState, from: number) => {
    const doc = state.doc.toString();
    const line = state.doc.lineAt(from);
    const lineText = line.text;
    
    // Match grammar block: GrammarName {
    const grammarMatch = lineText.match(/^\s*([A-Z][a-zA-Z0-9_]*)\s*\{/);
    
    if (grammarMatch) {
      // Find matching closing brace
      let currentPos = line.to;
      let braceCount = 1;
      
      while (currentPos < doc.length && braceCount > 0) {
        try {
          const nextLine = state.doc.lineAt(currentPos + 1);
          if (!nextLine || nextLine.from === currentPos) break;
          
          const nextLineText = nextLine.text;
          
          // Count braces (ignoring those in strings/comments)
          for (const char of nextLineText) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (braceCount === 0) {
              return {
                from: line.to,
                to: nextLine.from,
              };
            }
          }
          
          currentPos = nextLine.to;
        } catch {
          break;
        }
      }
    }
    
    // Match rule name only (Ohm allows rule name on separate line from =)
    const ruleNameOnlyMatch = lineText.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
    
    if (ruleNameOnlyMatch) {
      // Check if next line starts with = (or += or :=)
      try {
        const nextLine = state.doc.line(line.number + 1);
        const nextLineText = nextLine.text;
        
        if (nextLineText.match(/^\s*(?:=|\+=|:=)/)) {
          // This is a rule definition split across lines
          // Find the end of the rule
          const ruleIndent = lineText.match(/^\s*/)?.[0].length || 0;
          let currentLineNum = line.number + 1; // Start from the = line
          let lastContentLine = currentLineNum;
          
          // Scan for continuation
          while (currentLineNum < state.doc.lines) {
            try {
              const scanLine = state.doc.line(currentLineNum + 1);
              const scanText = scanLine.text;
              const scanIndent = scanText.match(/^\s*/)?.[0].length || 0;
              
              // Empty lines are OK
              if (scanText.trim() === '') {
                currentLineNum++;
                continue;
              }
              
              // Comment lines are OK
              if (scanText.trim().startsWith('//')) {
                currentLineNum++;
                lastContentLine = currentLineNum;
                continue;
              }
              
              // Check if this starts a new rule
              if (scanText.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*$/)) {
                // Could be a new rule name, check next line
                try {
                  const afterScan = state.doc.line(currentLineNum + 2);
                  if (afterScan.text.match(/^\s*(?:=|\+=|:=)/)) {
                    // Yes, it's a new rule
                    break;
                  }
                } catch {
                  // Can't check, assume it ends
                }
              }
              
              // Check for rule on same line
              if (scanText.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?:=|\+=|:=)/) && scanIndent <= ruleIndent) {
                break;
              }
              
              // Check for closing brace
              if (scanText.trim() === '}' && scanIndent <= ruleIndent) {
                break;
              }
              
              // Check if line is indented more (continuation)
              if (scanIndent > ruleIndent || scanText.trim().startsWith('|')) {
                lastContentLine = currentLineNum + 1;
              } else {
                break;
              }
              
              currentLineNum++;
            } catch {
              break;
            }
          }
          
          // Create fold if we have multiple lines
          if (lastContentLine > line.number) {
            const endLine = state.doc.line(lastContentLine);
            return {
              from: line.to,
              to: endLine.to,
            };
          }
        }
      } catch {
        // Next line doesn't exist or error
      }
    }
    
    // Match rule definition on same line: ruleName = or ruleName += or ruleName :=
    const ruleMatch = lineText.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|\+=|:=)/);
    
    if (ruleMatch) {
      const ruleIndent = lineText.match(/^\s*/)?.[0].length || 0;
      
      // Check if there's content on the same line after the =
      const afterEquals = lineText.substring(ruleMatch[0].length).trim();
      const hasContentOnSameLine = afterEquals.length > 0 && !afterEquals.startsWith('//');
      
      // Start scanning from the next line
      let currentLineNum = line.number;
      let lastContentLine = line.number;
      let foundContinuation = false;
      
      // Look ahead to find continuation lines
      while (currentLineNum < state.doc.lines) {
        try {
          const nextLine = state.doc.line(currentLineNum + 1);
          const nextLineText = nextLine.text;
          const nextLineIndent = nextLineText.match(/^\s*/)?.[0].length || 0;
          
          // Empty lines are OK, continue
          if (nextLineText.trim() === '') {
            currentLineNum++;
            continue;
          }
          
          // Comment lines are OK, continue
          if (nextLineText.trim().startsWith('//')) {
            currentLineNum++;
            lastContentLine = currentLineNum + 1;
            continue;
          }
          
          // Check if this starts a new rule name only
          if (nextLineText.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*$/)) {
            // Could be new rule, check if next line has =
            try {
              const afterNext = state.doc.line(currentLineNum + 2);
              if (afterNext.text.match(/^\s*(?:=|\+=|:=)/)) {
                // Yes, new rule starts
                break;
              }
            } catch {
              // Can't determine, be safe
            }
          }
          
          // Check if this line starts a new rule on same line
          if (nextLineText.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?:=|\+=|:=)/)) {
            if (nextLineIndent <= ruleIndent) {
              break;
            }
          }
          
          // Check for closing brace at same or lower indentation
          if (nextLineText.trim() === '}') {
            if (nextLineIndent <= ruleIndent) {
              break;
            }
          }
          
          // Check if line is indented more than the rule (continuation)
          // OR if it starts with | (alternative)
          if (nextLineIndent > ruleIndent || 
              (nextLineText.trim().startsWith('|') && nextLineIndent >= ruleIndent)) {
            lastContentLine = currentLineNum + 1;
            foundContinuation = true;
          } else {
            // Line at same or lower indentation that's not a continuation
            break;
          }
          
          currentLineNum++;
        } catch {
          break;
        }
      }
      
      // Determine if we should create a fold
      const hasContinuationLines = foundContinuation;
      const hasMultipleLines = lastContentLine > line.number;
      
      // Create fold if there are continuation lines OR if content starts on next line
      if (hasMultipleLines && (hasContinuationLines || !hasContentOnSameLine)) {
        const endLine = state.doc.line(lastContentLine);
        return {
          from: line.to,
          to: endLine.to,
        };
      }
    }
    
    return null;
  });
}

// ============================================================================
// Language Support
// ============================================================================

export function ohmGrammar() {
  return new LanguageSupport(ohmGrammarLanguage, [
    autocompletion({ override: [getOhmCompletions] }),
    createOhmLinter(),
    createOhmHover(),
    createOhmFoldService(),
  ]);
}

