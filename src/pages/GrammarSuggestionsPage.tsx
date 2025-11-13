import React from 'react';
import { useGrammar } from '@/context/GrammarContext';
import { SmartSuggestions } from '@/components/SmartSuggestions';

const GrammarSuggestionsPage: React.FC = () => {
  const { grammar } = useGrammar();

  return (
    <div className="mt-3">
      <SmartSuggestions grammarText={grammar} />
    </div>
  );
};

export default GrammarSuggestionsPage;

