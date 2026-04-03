import React, { createContext, useContext, useState, useCallback, useEffect, useLayoutEffect, type ReactNode } from 'react';
import type { ASTNode, TreeNode, GrammarExample } from '@/types/ast';
import type { Grammar } from '@/domain/types';
import { parseWithGrammar } from '@/lib/parser';
import { optimizeTree, astToTree } from '@/lib/treeOptimizer';
import { decodeStateFromUrl, clearShareUrl } from '@/lib/shareUtils';
import { useGrammarHistory } from '@/hooks/useGrammarHistory';
import { logger } from '@/shared/utils/logger';
import { exampleGrammars } from '@/data/examples';
import { parseGrammarFromText, serializeGrammarToText } from '@/domain/grammarParser';
import type { MappedError } from '@/services/ErrorMappingService';

/**
 * Grammar Context Type - DOMAIN STATE ONLY (NOW STORING DOMAIN OBJECTS)
 * The context now stores Grammar domain objects as the single source of truth.
 * Text serialization happens only when needed (for display, validation, sharing).
 * UI preferences like optimizeEnabled and collapsedRules have been moved to useLocalPreferences hook
 */
interface GrammarContextType {
  // Domain state - NOW DOMAIN OBJECTS, NOT STRINGS
  grammar: Grammar;
  programText: string;
  ast: ASTNode | null;
  error: string | null;
  mappedError: MappedError | null;
  
  // Computed trees (both versions available)
  optimizedTree: TreeNode | null;
  fullTree: TreeNode | null;
  
  // Statistics
  fullNodeCount: number;
  optimizedNodeCount: number;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  setGrammar: (value: Grammar) => void;
  setGrammarFromText: (text: string) => void; // NEW: Parse text and update grammar
  getGrammarAsText: () => string; // NEW: Serialize grammar to text
  setProgramText: (value: string) => void;
  parseGrammar: () => boolean;
  loadExample: (example: GrammarExample) => void;
  undo: () => void;
  redo: () => void;
  clearError: () => void;
}

const GrammarContext = createContext<GrammarContextType | undefined>(undefined);

// Helper function to count nodes in a tree
const countTreeNodes = (tree: TreeNode | null): number => {
  if (!tree) return 0;
  let count = 1;
  if (tree.children) {
    for (const child of tree.children) {
      count += countTreeNodes(child);
    }
  }
  return count;
};

export const GrammarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Check for shared state in URL on initialization
  const sharedState = decodeStateFromUrl();
  
  // Default to first example grammar (Arithmetic Calculator) if no shared state
  const defaultExample = exampleGrammars[0];
  
  // Parse initial grammar from text
  const initialGrammarText = sharedState?.grammar || defaultExample.grammar;
  const initialGrammar = parseGrammarFromText(initialGrammarText);
  
  // Domain state only - SINGLE SOURCE OF TRUTH (NOW DOMAIN OBJECTS)
  const [grammar, setGrammarInternal] = useState<Grammar>(initialGrammar);
  const [programText, setProgramText] = useState(sharedState?.programText || defaultExample.sampleInput);
  const [ast, setAst] = useState<ASTNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mappedError, setMappedError] = useState<MappedError | null>(null);
  
  // Both tree versions are computed and cached
  const [optimizedTree, setOptimizedTree] = useState<TreeNode | null>(null);
  const [fullTree, setFullTree] = useState<TreeNode | null>(null);
  const [fullNodeCount, setFullNodeCount] = useState(0);
  const [optimizedNodeCount, setOptimizedNodeCount] = useState(0);
  
  // Grammar history for undo/redo (stores serialized text for history)
  const grammarText = serializeGrammarToText(grammar);
  const { canUndo, canRedo, undo: undoHistory, redo: redoHistory, pushHistory } = useGrammarHistory(grammarText);
  
  // Clear the URL after loading shared state to prevent confusion
  // Only run once on mount, shared state is accessed directly above
  useEffect(() => {
    if (sharedState) {
      logger.info('Loaded shared state from URL');
      clearShareUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapped setGrammar with logging and history tracking
  const setGrammar = useCallback((newGrammar: Grammar, skipHistory = false) => {
    logger.debug('setGrammar called', { 
      name: newGrammar.name,
      ruleCount: newGrammar.rules.length
    });
    setGrammarInternal(newGrammar);
    
    // Push to history (will be debounced internally)
    if (!skipHistory) {
      const text = serializeGrammarToText(newGrammar);
      pushHistory(text);
    }
  }, [pushHistory]);

  // NEW: Set grammar from text (parse and update)
  const setGrammarFromText = useCallback((text: string, skipHistory = false) => {
    const parsed = parseGrammarFromText(text);
    setGrammar(parsed, skipHistory);
  }, [setGrammar]);

  // NEW: Get grammar as text (serialize)
  const getGrammarAsText = useCallback((): string => {
    if (!grammar || !grammar.name) {
      return '';
    }
    return serializeGrammarToText(grammar);
  }, [grammar]);

  // Undo grammar change
  const undo = useCallback(() => {
    const previousGrammarText = undoHistory();
    if (previousGrammarText !== null) {
      const parsed = parseGrammarFromText(previousGrammarText);
      setGrammarInternal(parsed);
      logger.debug('Undo successful');
    }
  }, [undoHistory]);

  // Redo grammar change
  const redo = useCallback(() => {
    const nextGrammarText = redoHistory();
    if (nextGrammarText !== null) {
      const parsed = parseGrammarFromText(nextGrammarText);
      setGrammarInternal(parsed);
      logger.debug('Redo successful');
    }
  }, [redoHistory]);

  // Generate both tree versions when AST changes
  // Components can choose which tree to use via their own UI preferences
  // Using useLayoutEffect to avoid setState in effect lint warning
  useLayoutEffect(() => {
    if (ast) {
      const full = astToTree(ast);
      const optimized = optimizeTree(ast);
      
      setFullTree(full);
      setOptimizedTree(optimized);
      setFullNodeCount(countTreeNodes(full));
      setOptimizedNodeCount(countTreeNodes(optimized));
    }
  }, [ast]);

  const parseGrammar = useCallback((): boolean => {
    setError(null);
    setMappedError(null);
    
    // Serialize grammar to text for Ohm.js
    const grammarText = serializeGrammarToText(grammar);
    
    if (!grammarText.trim()) {
      setError('Please enter a grammar');
      setMappedError(null);
      return false;
    }

    if (!programText.trim()) {
      setError('Please enter text to parse');
      setMappedError(null);
      return false;
    }

    const result = parseWithGrammar(grammarText, programText);

    if (result.success && result.ast) {
      // Store AST (will trigger tree generation via useEffect)
      setAst(result.ast);
      setError(null);
      setMappedError(null);
      return true;
    } else {
      setError(result.error || 'Failed to parse');
      setMappedError(null);
      // Keep the last valid AST and trees instead of clearing them
      return false;
    }
  }, [grammar, programText]);

  const loadExample = useCallback((example: GrammarExample) => {
    // Parse grammar text from example
    const parsedGrammar = parseGrammarFromText(example.grammar);
    setGrammar(parsedGrammar);
    setProgramText(example.sampleInput);
    setError(null);
    setMappedError(null);
    
    // Auto-parse the example
    setTimeout(() => {
      const result = parseWithGrammar(example.grammar, example.sampleInput);
      if (result.success && result.ast) {
        // Store AST (will trigger tree generation via useEffect)
        setAst(result.ast);
        setError(null);
        setMappedError(null);
      } else {
        setError(result.error || 'Failed to parse example');
        setMappedError(null);
        // Keep any existing AST/trees
      }
    }, 100);
  }, [setGrammar]);

  // NEW: Function to clear error state
  const clearError = useCallback(() => {
    setError(null);
    setMappedError(null);
  }, []);

  const value: GrammarContextType = {
    // Domain state
    grammar,
    programText,
    ast,
    error,
    mappedError,
    
    // Both tree versions available
    optimizedTree,
    fullTree,
    
    // Statistics
    fullNodeCount,
    optimizedNodeCount,
    
    // History
    canUndo,
    canRedo,
    
    // Actions
    setGrammar,
    setGrammarFromText,
    getGrammarAsText,
    setProgramText,
    parseGrammar,
    loadExample,
    undo,
    redo,
    clearError,
  };

  return (
    <GrammarContext.Provider value={value}>
      {children}
    </GrammarContext.Provider>
  );
};

export const useGrammar = (): GrammarContextType => {
  const context = useContext(GrammarContext);
  if (!context) {
    throw new Error('useGrammar must be used within a GrammarProvider');
  }
  return context;
};

