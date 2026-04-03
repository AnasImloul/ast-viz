import React from 'react';
import { useGrammar } from '@/context/GrammarContext';
import { EnhancedCodeEditor } from '@/components/EnhancedCodeEditor';

/**
 * Code Editor Page
 * 
 * This page displays the enhanced code editor with:
 * - Autocomplete for Ohm.js grammar
 * - Syntax highlighting
 * - Error diagnostics
 * - Format/Prettify
 * - Keyboard shortcuts
 */
const GrammarCodeEditorPage: React.FC = () => {
  const { getGrammarAsText, setGrammarFromText } = useGrammar();
  
  // Get current grammar as text
  const grammarText = getGrammarAsText();

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <EnhancedCodeEditor
        value={grammarText}
        onChange={(value) => setGrammarFromText(value)}
      />
    </div>
  );
};

export default GrammarCodeEditorPage;

