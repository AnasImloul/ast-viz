import React from 'react';
import { useGrammar } from '@/context/GrammarContext';
import { RuleDependencyGraph } from '@/components/RuleDependencyGraph';

const GrammarDependenciesPage: React.FC = () => {
  const { getGrammarAsText } = useGrammar();

  return (
    <div className="flex-1 min-h-0 border rounded-lg bg-muted/30">
      <RuleDependencyGraph grammarText={getGrammarAsText()} />
    </div>
  );
};

export default GrammarDependenciesPage;
