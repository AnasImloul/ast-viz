import React, { useMemo } from 'react';
import type { ASTNode } from '@/types/ast';

interface SyntaxHighlightedEditorProps {
  value: string;
  ast: ASTNode | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  selectedInterval?: { startIdx: number; endIdx: number } | null;
}

interface HighlightRange {
  start: number;
  end: number;
  ruleName: string;
  color: string;
}

// Map rule names to colors
const getRuleColor = (ruleName: string): string => {
  const lowerName = ruleName.toLowerCase();
  
  // Boolean/null literals - check exact values and patterns
  if (lowerName === 'true' || lowerName === 'false' || lowerName === 'null' ||
      lowerName.includes('true') || lowerName.includes('false') || 
      lowerName.includes('null') || lowerName.includes('boolean') ||
      lowerName.includes('bool')) {
    return '#d946ef'; // Pink for boolean/null
  }
  
  // Keywords
  if (lowerName.includes('keyword') || 
      ['if', 'else', 'while', 'for', 'return', 'function', 'var', 'let', 'const'].includes(lowerName)) {
    return '#d946ef'; // Pink for keywords
  }
  
  // Check if it's a number (actual digits)
  if (/^\d+(\.\d+)?$/.test(ruleName)) {
    return '#f97316'; // Orange for numeric literals
  }
  
  // Numbers - check for common patterns
  if (lowerName.includes('number') || lowerName.includes('digit') || 
      lowerName.includes('integer') || lowerName.includes('decimal') ||
      lowerName.includes('num') || lowerName === 'priexpr' || 
      (lowerName.includes('literal') && !lowerName.includes('string'))) {
    return '#f97316'; // Orange for numbers
  }
  
  // Check for quoted strings
  if (ruleName.startsWith('"') && ruleName.endsWith('"')) {
    return '#10b981'; // Green for string literals
  }
  
  // Strings
  if (lowerName.includes('string') || lowerName.includes('char') ||
      lowerName.includes('text') || lowerName.includes('quoted')) {
    return '#10b981'; // Green for strings
  }
  
  // Check if it's a lowercase rule (lexical token in Ohm.js convention)
  // Lowercase rules starting with specific prefixes get specific colors
  if (/^[a-z]/.test(ruleName)) {
    if (lowerName.includes('field') || lowerName.includes('token')) {
      return '#10b981'; // Green for field/token types
    }
  }
  
  // Identifiers/variables
  if (lowerName.includes('identifier') || lowerName.includes('ident') || 
      lowerName.includes('name') || lowerName.includes('variable') ||
      lowerName.includes('property') || lowerName.includes('key')) {
    return '#3b82f6'; // Blue for identifiers
  }
  
  // Operators and Expressions
  if (lowerName.includes('operator') || lowerName.includes('op') ||
      lowerName.includes('plus') || lowerName.includes('minus') ||
      lowerName.includes('times') || lowerName.includes('divide') ||
      lowerName.includes('addexpr') || lowerName.includes('mulexpr') ||
      ['expr', 'expression'].includes(lowerName)) {
    return '#8b5cf6'; // Purple for operators/expressions
  }
  
  // Comments
  if (lowerName.includes('comment')) {
    return '#64748b'; // Gray for comments
  }
  
  // Functions/Methods
  if (lowerName.includes('function') || lowerName.includes('method') || lowerName.includes('call')) {
    return '#eab308'; // Yellow for functions
  }
  
  // Types/Classes/Objects
  if (lowerName.includes('type') || lowerName.includes('class') || 
      lowerName.includes('object') || lowerName.includes('array')) {
    return '#06b6d4'; // Cyan for types
  }
  
  // Punctuation - single characters or symbols
  if (ruleName.length === 1 || lowerName.match(/^[^a-z0-9]+$/)) {
    return '#94a3b8'; // Slate for punctuation
  }
  
  // Letter sequences (unrecognized words) - treat as identifiers
  if (/^[a-zA-Z]+$/.test(ruleName)) {
    return '#cbd5e1'; // Light slate for unrecognized text
  }
  
  // Default - slightly more visible
  return '#9ca3af'; // Gray default
};

// Define which node types should be highlighted as complete units
const isSemanticToken = (nodeName: string): boolean => {
  const lowerName = nodeName.toLowerCase();
  
  // These are meaningful tokens that should be highlighted as a whole
  return (
    lowerName.includes('string') ||
    lowerName.includes('number') ||
    lowerName.includes('identifier') ||
    lowerName.includes('keyword') ||
    lowerName.includes('comment') ||
    lowerName.includes('boolean') ||
    lowerName.includes('bool') ||
    lowerName === 'true' ||
    lowerName === 'false' ||
    lowerName === 'null' ||
    lowerName.includes('_true') ||
    lowerName.includes('_false') ||
    lowerName.includes('_null')
  );
};

// Extract highlight ranges from AST
const extractHighlights = (node: ASTNode, ranges: HighlightRange[] = [], depth = 0): HighlightRange[] => {
  // If no interval, skip this node but recurse into children
  if (!node.interval) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => extractHighlights(child, ranges, depth + 1));
    }
    return ranges;
  }
  
  const { startIdx, endIdx } = node.interval;
  
  // Skip empty ranges
  if (startIdx === endIdx) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => extractHighlights(child, ranges, depth + 1));
    }
    return ranges;
  }
  
  // If this is a semantic token (String, Number, etc.), highlight it as a whole unit
  if (isSemanticToken(node.name)) {
    ranges.push({
      start: startIdx,
      end: endIdx,
      ruleName: node.name,
      color: getRuleColor(node.name),
    });
    return ranges; // Don't recurse into children for semantic tokens
  }
  
  // If this is a leaf node, check if we should highlight it
  if (!node.children || node.children.length === 0) {
    // For terminal nodes, use their value
    const effectiveName = node.name === '_terminal' ? 
      (node.value || 'unknown') : 
      node.name;
    
    ranges.push({
      start: startIdx,
      end: endIdx,
      ruleName: effectiveName,
      color: getRuleColor(effectiveName),
    });
    return ranges;
  }
  
  // For non-semantic parent nodes, recurse into children
  node.children.forEach(child => extractHighlights(child, ranges, depth + 1));
  
  return ranges;
};

// Merge overlapping ranges (keep the most specific/smallest range)
const mergeRanges = (ranges: HighlightRange[]): HighlightRange[] => {
  if (ranges.length === 0) return [];
  
  // Sort by start position, then by length (shorter first)
  const sorted = ranges.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (a.end - a.start) - (b.end - b.start);
  });
  
  const merged: HighlightRange[] = [];
  const covered = new Set<number>();
  
  // Keep smaller ranges over larger ones when they overlap
  for (const range of sorted) {
    let shouldAdd = true;
    for (let i = range.start; i < range.end; i++) {
      if (covered.has(i)) {
        shouldAdd = false;
        break;
      }
    }
    
    if (shouldAdd) {
      merged.push(range);
      for (let i = range.start; i < range.end; i++) {
        covered.add(i);
      }
    }
  }
  
  return merged.sort((a, b) => a.start - b.start);
};

// Convert text and ranges to highlighted HTML
const createHighlightedContent = (text: string, ranges: HighlightRange[]): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  ranges.forEach((range, idx) => {
    // Add unhighlighted text before this range
    if (range.start > lastIndex) {
      result.push(
        <span key={`text-${idx}`} className="text-foreground/90">
          {text.substring(lastIndex, range.start)}
        </span>
      );
    }
    
    // Add highlighted range
    result.push(
      <span
        key={`highlight-${idx}`}
        style={{ color: range.color }}
        className="font-medium"
        title={range.ruleName}
      >
        {text.substring(range.start, range.end)}
      </span>
    );
    
    lastIndex = range.end;
  });
  
  // Add remaining unhighlighted text
  if (lastIndex < text.length) {
    result.push(
      <span key="text-end" className="text-foreground/90">
        {text.substring(lastIndex)}
      </span>
    );
  }
  
  return result;
};

export const SyntaxHighlightedEditor: React.FC<SyntaxHighlightedEditorProps> = ({
  value,
  ast,
  onChange,
  placeholder,
  className = '',
  onFocus,
  onBlur,
  selectedInterval,
}) => {
  // Extract and merge highlight ranges from AST
  const highlightedContent = useMemo(() => {
    if (!ast || !value) {
      return null;
    }
    
    const ranges = extractHighlights(ast);
    const merged = mergeRanges(ranges);
    return createHighlightedContent(value, merged);
  }, [ast, value]);
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Highlighted overlay */}
      {highlightedContent && (
        <div
          className="absolute inset-0 pointer-events-none overflow-auto font-mono text-sm whitespace-pre-wrap break-words px-3 py-2"
          style={{
            lineHeight: '1.5',
          }}
        >
          {highlightedContent}
        </div>
      )}
      
      {/* Selected interval highlight */}
      {selectedInterval && (
        <div
          className="absolute inset-0 pointer-events-none overflow-auto font-mono text-sm whitespace-pre-wrap break-words pl-3 pr-3 py-2"
          style={{
            lineHeight: '1.5',
            paddingLeft: '0.75rem',
          }}
        >
          <span style={{ color: 'transparent' }}>
            {value.substring(0, selectedInterval.startIdx)}
          </span>
          <mark
            className="text-transparent"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.6)',
              borderRadius: '2px',
              padding: 0,
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
          >
            {value.substring(selectedInterval.startIdx, selectedInterval.endIdx)}
          </mark>
        </div>
      )}
      
      {/* Actual textarea (transparent text when highlighted) */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`
          w-full h-full font-mono text-sm resize-none bg-transparent px-3 py-2
          ${highlightedContent ? 'text-transparent caret-blue-500' : 'text-foreground'}
        `}
        style={{
          lineHeight: '1.5',
        }}
        spellCheck={false}
      />
    </div>
  );
};

