import React from 'react';
import { useGrammar } from '@/context/GrammarContext';
import { SmartSuggestions } from '@/components/SmartSuggestions';

const GrammarSuggestionsPage: React.FC = () => {
  const { getGrammarAsText } = useGrammar();

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <SmartSuggestions grammarText={getGrammarAsText()} />
    </div>
  );
};

export default GrammarSuggestionsPage;
