import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ASTNode, TreeNode, GrammarExample } from '@/types/ast';
import { parseWithGrammar } from '@/lib/parser';
import { optimizeTree, astToTree } from '@/lib/treeOptimizer';

interface GrammarContextType {
  grammar: string;
  programText: string;
  ast: ASTNode | null;
  tree: TreeNode | null;
  error: string | null;
  optimizeEnabled: boolean;
  collapsedRules: Set<string>;
  setGrammar: (value: string) => void;
  setProgramText: (value: string) => void;
  setOptimizeEnabled: (value: boolean) => void;
  toggleRuleCollapsed: (ruleId: string) => void;
  parseGrammar: () => boolean;
  loadExample: (example: GrammarExample) => void;
}

const GrammarContext = createContext<GrammarContextType | undefined>(undefined);

export const GrammarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [grammar, setGrammar] = useState('');
  const [programText, setProgramText] = useState('');
  const [ast, setAst] = useState<ASTNode | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizeEnabled, setOptimizeEnabled] = useState(true);
  const [collapsedRules, setCollapsedRules] = useState<Set<string>>(new Set());

  // Re-generate tree when optimization setting changes
  useEffect(() => {
    if (ast) {
      const treeData = optimizeEnabled ? optimizeTree(ast) : astToTree(ast);
      setTree(treeData);
    }
  }, [optimizeEnabled, ast]);

  const parseGrammar = useCallback((): boolean => {
    setError(null);
    
    if (!grammar.trim()) {
      setError('Please enter a grammar');
      return false;
    }

    if (!programText.trim()) {
      setError('Please enter text to parse');
      return false;
    }

    const result = parseWithGrammar(grammar, programText);

    if (result.success && result.ast) {
      setAst(result.ast);
      const treeData = optimizeEnabled ? optimizeTree(result.ast) : astToTree(result.ast);
      setTree(treeData);
      setError(null);
      return true;
    } else {
      setError(result.error || 'Failed to parse');
      // Keep the last valid AST and tree instead of clearing them
      return false;
    }
  }, [grammar, programText, optimizeEnabled]);

  const loadExample = useCallback((example: GrammarExample) => {
    setGrammar(example.grammar);
    setProgramText(example.sampleInput);
    setError(null);
    
    // Clear collapsed rules when loading a new example (different rule set)
    setCollapsedRules(new Set());
    
    // Auto-parse the example
    setTimeout(() => {
      const result = parseWithGrammar(example.grammar, example.sampleInput);
      if (result.success && result.ast) {
        setAst(result.ast);
        const treeData = optimizeEnabled ? optimizeTree(result.ast) : astToTree(result.ast);
        setTree(treeData);
        setError(null);
      } else {
        setError(result.error || 'Failed to parse example');
        // Keep any existing AST/tree
      }
    }, 100);
  }, [optimizeEnabled]);

  const toggleRuleCollapsed = useCallback((ruleId: string) => {
    setCollapsedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  }, []);

  const value: GrammarContextType = {
    grammar,
    programText,
    ast,
    tree,
    error,
    optimizeEnabled,
    collapsedRules,
    setGrammar,
    setProgramText,
    setOptimizeEnabled,
    toggleRuleCollapsed,
    parseGrammar,
    loadExample,
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

