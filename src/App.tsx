import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GrammarProvider } from '@/context/GrammarContext';
import GrammarEditorLayout from '@/pages/GrammarEditorLayout';
import GrammarVisualBuilderPage from '@/pages/GrammarVisualBuilderPage';
import GrammarCodeEditorPage from '@/pages/GrammarCodeEditorPage';
import GrammarDependenciesPage from '@/pages/GrammarDependenciesPage';
import GrammarSuggestionsPage from '@/pages/GrammarSuggestionsPage';
import VisualizationPage from '@/pages/VisualizationPage';

function App() {
  return (
    <GrammarProvider>
      <Router>
        <Routes>
          <Route path="/grammar" element={<GrammarEditorLayout />}>
            <Route path="builder" element={<GrammarVisualBuilderPage />} />
            <Route path="code" element={<GrammarCodeEditorPage />} />
            <Route path="dependencies" element={<GrammarDependenciesPage />} />
            <Route path="suggestions" element={<GrammarSuggestionsPage />} />
          </Route>
          <Route path="/visualize" element={<VisualizationPage />} />
          <Route path="/" element={<Navigate to="/grammar/builder" replace />} />
          <Route path="*" element={<Navigate to="/grammar/builder" replace />} />
        </Routes>
      </Router>
    </GrammarProvider>
  );
}

export default App;
