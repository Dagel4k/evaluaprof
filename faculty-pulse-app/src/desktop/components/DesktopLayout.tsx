import React from 'react';
import { Outlet } from 'react-router-dom';

const DesktopLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar Area - Hidden on Mobile */}
      <aside className="w-64 border-r bg-muted/20 p-4 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight text-primary">EvaluaProf</h1>
          <p className="text-sm text-muted-foreground">Scheduler v1.0</p>
        </div>
        
        <nav className="space-y-2">
          <div className="px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium text-sm">
            Mi Horario
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        <header className="h-14 border-b flex items-center px-4 sm:px-6 sticky top-0 bg-background/95 backdrop-blur z-30">
          <h2 className="font-semibold text-sm sm:text-base">Constructor de Horario</h2>
        </header>
        <div className="p-2 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DesktopLayout;
