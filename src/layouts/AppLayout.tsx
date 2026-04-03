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
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-foreground">
                AST Visualizer
              </h1>
              
              {isVisualizePage && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/grammar/code')}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Editor
                  </Button>
                </>
              )}
              
              {isGrammarPage && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <span className="text-sm text-muted-foreground">
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
