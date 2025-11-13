import React from 'react';
import { useGrammar } from '@/context/GrammarContext';
import GrammarBuilder from '@/components/GrammarBuilder';

const GrammarVisualBuilderPage: React.FC = () => {
  const { grammar, setGrammar } = useGrammar();

  return (
    <div className="mt-3">
      <GrammarBuilder onGrammarGenerated={setGrammar} initialGrammar={grammar} />
    </div>
  );
};

export default GrammarVisualBuilderPage;

