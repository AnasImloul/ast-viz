import React, { useState } from 'react';
import { useGrammar } from '@/context/GrammarContext';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

const GrammarCodeEditorPage: React.FC = () => {
  const { grammar, setGrammar } = useGrammar();
  const [grammarFocused, setGrammarFocused] = useState(false);

  return (
    <div className="mt-3">
      <div className={`rounded-md border-2 overflow-hidden transition-colors ${
        grammarFocused ? 'border-primary' : 'border-input'
      }`}>
        <CodeMirror
          value={grammar}
          height="400px"
          extensions={[javascript()]}
          onChange={(value) => setGrammar(value)}
          onFocus={() => setGrammarFocused(true)}
          onBlur={() => setGrammarFocused(false)}
          placeholder="Enter your Ohm.js grammar here..."
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    </div>
  );
};

export default GrammarCodeEditorPage;

