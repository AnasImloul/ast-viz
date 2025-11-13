import React from 'react';
import { useGrammar } from '@/context/GrammarContext';
import { RuleDependencyGraph } from '@/components/RuleDependencyGraph';

const GrammarDependenciesPage: React.FC = () => {
  const { grammar } = useGrammar();

  return (
    <div className="mt-3">
      <div className="h-[500px] border-2 rounded-lg bg-slate-50 dark:bg-slate-950">
        <RuleDependencyGraph grammarText={grammar} />
      </div>
    </div>
  );
};

export default GrammarDependenciesPage;

