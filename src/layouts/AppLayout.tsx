import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  
  const isVisualizePage = location.pathname === '/visualize';
  const isGrammarPage = location.pathname.startsWith('/grammar');
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-background focus:border focus:rounded-md focus:m-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <header className="border-b bg-background">
        <div className="container mx-auto px-3 hd:px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 hd:gap-4 min-w-0">
              <h1 className="text-base hd:text-lg font-semibold text-foreground shrink-0">
                AST Visualizer
              </h1>

              {isVisualizePage && (
                <>
                  <div className="h-5 w-px bg-border shrink-0" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/grammar/code')}
                    className="gap-1 hd:gap-2 text-muted-foreground hover:text-foreground px-1 hd:px-3"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden hd:inline">Back to Editor</span>
                  </Button>
                </>
              )}

              {isGrammarPage && (
                <>
                  <div className="hidden hd:block h-5 w-px bg-border" />
                  <span className="hidden hd:inline text-sm text-muted-foreground">
                    Grammar Editor
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div id="header-actions" className="flex items-center gap-2" />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="h-8 w-8"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div id="main-content" className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
